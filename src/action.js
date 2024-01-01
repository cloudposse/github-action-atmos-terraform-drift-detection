const fs = require('fs');
const core = require('@actions/core');
const artifact = require('@actions/artifact');
const {StackFromIssue} = require("./models/stacks_from_issues");
const {Skip} = require("./operations/skip");
const {Update} = require("./operations/update");
const {Close} = require("./operations/close");
const {Remove} = require("./operations/remove");
const {Create} = require("./operations/create");
const {Nothing} = require("./operations/nothing");

const downloadArtifacts = (artifactName) => {
    const artifactClient = artifact.create()
    const downloadDirectory = '.'

    // Downloading the artifact
    return artifactClient.downloadArtifact(artifactName, downloadDirectory)
        .then((item) => {
            core.info(`Artifact ${artifactName} downloaded to ${item.downloadPath}`);
            return item.downloadPath
        })
};

const mapOpenGitHubIssuesToComponents = async (octokit, context, labels) => {
    const repository = context.repo;

    const listIssues = async (per_page, page, result) => {
        const response = await octokit.rest.issues.listForRepo({
            ...repository,
            state: 'open',
            labels: labels,
            per_page,
            page
        });

        if (response.data.length === 0) {
            return result
        }

        const driftDetectionIssues = response.data.filter(
            issue => issue.title.startsWith('Drift Detected in') || issue.title.startsWith('Failure Detected in')
        );

        const result_partition = driftDetectionIssues.map(issue => {
            return new StackFromIssue(issue);
        })

        return await listIssues(per_page, page+1, result.concat(result_partition))
    }

    let per_page = 100; // Max allowed value per page
    let result = await listIssues(per_page, 1, [])
    return new Map(result.map(
        (stackFromIssue) => {
            return [stackFromIssue.slug, stackFromIssue]
        }
    ))
}

class StackFromArchive {
    constructor(metadata) {
        this.metadata = metadata;
        this.drifted = metadata.drifted;
        this.error = metadata.error;
        this.slug = `${metadata.stack}-${metadata.component}`;
    }
}

const readMetadataFromPlanArtifacts = (path) => {
    const files = fs.readdirSync(path);
    const metadataFiles = files.filter(file => file.endsWith('metadata.json'));
    const result = metadataFiles.map(
        (file) => {
            const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));

            const stackFromArchive = new StackFromArchive(metadata);
            return [stackFromArchive.slug, stackFromArchive]
        }
    )
    return new Map(result)
}

const triage = async (componentsToIssue, componentsToPlanState, users, labels, maxOpenedIssues, processAll) => {

    const fullComponents = processAll ?
        [...componentsToIssue.keys(), ...componentsToPlanState.keys()] :
        [...componentsToPlanState.keys()]
    const slugs = [...new Set(fullComponents)]  // get unique set

    const operations = slugs.map((slug) => {
        const issue = componentsToIssue.get(slug)
        const state = componentsToPlanState.get(slug)
        if (issue && state) {
            if (state.error || state.drifted) {
                const commitSHA = issue.metadata.commitSHA;
                const currentSHA = "${{ github.sha }}";

                return currentSHA === commitSHA ? new Skip(issue, state) : new Update(issue, state, labels)
            }
            return new Close(issue, state)

        } else if (issue) {
            return new Remove(issue)
        } else if (state && (state.error || state.drifted)) {
            return new Create(state, users, labels)
        }

        return new Nothing()
    })

    const openedIssuesCounts = operations.filter((operation) => {
        return operation instanceof Update
    }).length

    const closedIssuesCount = operations.filter((operation) => {
        return operation instanceof Close || operation instanceof Remove
    }).length

    const numberOfMaximumPotentialIssuesThatCanBeCreated = Math.max(0, maxOpenedIssues - openedIssuesCounts);
    let numOfIssuesToCreate = Math.min(numberOfMaximumPotentialIssuesThatCanBeCreated, maxOpenedIssues);

    console.log(openedIssuesCounts)
    console.log(closedIssuesCount)
    console.log(numberOfMaximumPotentialIssuesThatCanBeCreated)
    console.log(numOfIssuesToCreate)

    return operations.map((operation) => {
        const newOperation = operation instanceof Create && numOfIssuesToCreate === 0 ?
            new Skip(operation.issue, operation.state, maxOpenedIssues) :
            operation;

        if (operation instanceof Create) {
            if (numOfIssuesToCreate > 0) {
                numOfIssuesToCreate -= 1
            }
        }

        return newOperation
    })
}

const convertTeamsToUsers = async (octokit, orgName, teams) => {
    let users = [];

    if (teams.length === 0) {
        console.log("No users to assign issue with. Skipping ...");
    } else {
        try {
            let usersFromTeams = [];

            for (let i = 0; i < teams.length; i++) {
                const response = await octokit.rest.teams.listMembersInOrg({
                    org: orgName,
                    team_slug: teams[i]
                });

                const usersForCurrentTeam = response.data.map(user => user.login);
                usersFromTeams = usersFromTeams.concat(usersForCurrentTeam);
            }

            users = users.concat(usersFromTeams);
            users = [...new Set(users)]; // get unique set
        } catch (error) {
            core.error(`Failed to associate user to an issue. Error ${error.message}`);
            users = [];
        }
    }

    return users;
}


const postDriftDetectionSummary = async (context, results) => {
    const table = [ `| Component | State | Comments |`];
    table.push(`|---|---|---|`)

    results.map( (result) => {
        return result.render()
    }).filter((result) => {
        return result !== ""
    }).forEach((result) => {
        table.push(result)
    })

    if (table.length > 2) {
      await core.summary
        .addRaw('# Drift Detection Summary', true)
        .addRaw(table.join("\n"), true)
        .addRaw("\n", true)
        .write()
    } else {
      await core.summary.addRaw("No drift detected").write();
    }
}

const postStepSummaries = async (components) => {
    const summaries = components.map((component) => {
        return component.summary()
    }).filter((summary) => {
        return summary !== ""
    })
    for (const summary of summaries) {
        await core.summary.addRaw(summary, true).write();
    }
}

/**
 * @param {Object} octokit
 * @param {Object} context
 * @param {Object} parameters
 */
const runAction = async (octokit, context, parameters) => {
    const {
        maxOpenedIssues = 0,
        assigneeUsers = [],
        assigneeTeams = [],
        labels        = [],
        processAll  = false,
    } = parameters;

    const metadataFromPlanArtifacts= await downloadArtifacts("metadata").then(
        (path) => {
            return readMetadataFromPlanArtifacts(path)
        }
    )

    const openGitHubIssuesToComponents = await mapOpenGitHubIssuesToComponents(octokit, context, labels);

    const usersFromTeams = await convertTeamsToUsers(octokit, context.repo.owner, assigneeTeams);
    let users = assigneeUsers.concat(usersFromTeams);
    users = [...new Set(users)]; // get unique set

    const triageResults = await triage(openGitHubIssuesToComponents, metadataFromPlanArtifacts, users, labels, maxOpenedIssues, processAll);

    const results = await Promise.all(triageResults.map((operation) => {
        return operation.run(octokit, context)
    }))

    await postDriftDetectionSummary(context, results);
    await postStepSummaries(triageResults);
}

module.exports = {
    runAction
}
