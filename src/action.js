const fs = require('fs');
const core = require('@actions/core');
const artifact = require('@actions/artifact');
const github = require('@actions/github');

const downloadArtifacts = async (artifactName) => {
    try {
        const artifactClient = artifact.create()
        const downloadDirectory = '.'
    
        // Downloading the artifact
        const downloadResponse = await artifactClient.downloadArtifact(artifactName, downloadDirectory);

        core.info(`Artifact ${artifactName} downloaded to ${downloadResponse.downloadPath}`);
      } catch (error) {
        throw new Error(`Failed to download artifacts: ${error.message}`);
      }
};

const getMetadataFromIssueBody = (body) => {
    const regex = /```json\s([\s\S]+?)\s```/;
    const matched = body.match(regex);

    if (matched && matched[1]) {
      return JSON.parse(matched[1]);
    } else {
      throw new Error("Invalid metadata in the issue description");
    }
  }

const mapOpenGitHubIssuesToComponents = async (octokit, context) => {
    const repository = context.repo;

    let per_page = 100; // Max allowed value per page
    let page = 1;
    let componentsToIssues = {};
    let componentsToMetadata = {};
    let isContinue = true;

    while (isContinue) {
      const response = await octokit.rest.issues.listForRepo({
        ...repository,
        state: 'open',
        per_page,
        page
      });
      
      if (response.data.length === 0) {
        isContinue = false;
      } else {
        const driftDetectionIssues = response.data
          .filter(issue => issue.title.startsWith('Drift Detected in'));
        
        for (let issue of driftDetectionIssues) {
          const metadata = getMetadataFromIssueBody(issue.body);
          componentsToIssues[`${metadata.stack}-${metadata.component}`] = issue.number;
          componentsToMetadata[`${metadata.stack}-${metadata.component}`] = metadata;
        }

        page++;
      }
    }

    return {
        componentsToIssues: componentsToIssues,
        componentsToMetadata: componentsToMetadata,
    };
}

const readMetadataFromPlanArtifacts = async () => {
    const files = fs.readdirSync('.');
    const metadataFiles = files.filter(file => file.endsWith('metadata.json'));

    let componentsToState = {};
    let componentsToMetadata = {};

    for (let i = 0; i < metadataFiles.length; i++) {
        const metadata = JSON.parse(fs.readFileSync(metadataFiles[i], 'utf8'));

        const slug = `${metadata.stack}-${metadata.component}`;
        const drifted = metadata.drifted || metadata.error;

        componentsToState[slug] = drifted;
        componentsToMetadata[slug] = metadata;    
    }

    return {
        componentsToState: componentsToState,
        componentsToMetadata: componentsToMetadata,
    };
}

const triage = async(componentsToIssueNumber, componentsToIssueMetadata, componentsToPlanState) => {
    let slugs = new Set([...Object.keys(componentsToIssueNumber), ...Object.keys(componentsToPlanState)]);

    const componentsCandidatesToCreateIssue = [];
    const componentsCandidatesToCloseIssue = [];
    const componentsToUpdateExistingIssue = [];
    const removedComponents = [];
    const recoveredComponents = [];
    const driftingComponents = [];

    for (let slug of slugs) {
        if (componentsToIssueNumber.hasOwnProperty(slug)) {
            const issueNumber = componentsToIssueNumber[slug];

            if (componentsToPlanState.hasOwnProperty(slug)) {
                const drifted = componentsToPlanState[slug];

                if (drifted) {
                const commitSHA = componentsToIssueMetadata[slug].commitSHA;
                const currentSHA = "${{ github.sha }}";
                if (currentSHA === commitSHA) {
                    core.info(`Component "${slug}" marked as drifted but default branch SHA didn't change so nothing to update. Skipping ...`);
                    driftingComponents.push(slug);
                } else {
                    core.info(`Component "${slug}" is still drifting. Issue ${issueNumber} needs to be updated.`);
                    componentsToUpdateExistingIssue.push(slug);
                    driftingComponents.push(slug);
                }
                } else {
                core.info(`Component "${slug}" is not drifting anymore. Issue ${issueNumber} needs to be closed.`);
                componentsCandidatesToCloseIssue.push(slug);
                recoveredComponents.push(slug);
                }
            } else {
                core.info(`Component "${slug}" has been removed. Issue ${issueNumber} needs to be closed.`);
                componentsCandidatesToCloseIssue.push(slug);
                removedComponents.push(slug);
            }
        } else {
            const drifted = componentsToPlanState[slug];

            if (drifted) {
                core.info(`Component "${slug}" drifted. New issue has to be created.`);
                componentsCandidatesToCreateIssue.push(slug);
                driftingComponents.push(slug);
            } else {
                core.info(`Component "${slug}" is not drifting. Skipping ...`);
            }
        }
    }

    return {
        componentsCandidatesToCreateIssue: componentsCandidatesToCreateIssue,
        componentsToUpdateExistingIssue: componentsToUpdateExistingIssue,
        removedComponents: removedComponents,
        recoveredComponents: recoveredComponents,
        driftingComponents: driftingComponents,
        componentsCandidatesToCloseIssue: componentsCandidatesToCloseIssue,
    }
}

const closeIssues = async (octokit, context, componentsToIssueNumber, removedComponents, recoveredComponents) => {
    const componentsToCloseIssuesFor = removedComponents.concat(recoveredComponents);

    const repository = context.repo;

    for (let i = 0; i < componentsToCloseIssuesFor.length; i++) {
      const slug = componentsToCloseIssuesFor[i];
      const issueNumber = componentsToIssueNumber[slug];

      octokit.rest.issues.update({
        ...repository,
        issue_number: issueNumber,
        state: "closed"
      });

      octokit.rest.issues.addLabels({
        ...repository,
        issue_number: issueNumber,
        labels: ['drift-recovered']
      });

      const comment = removedComponents.hasOwnProperty(slug) ? `Component \`${slug}\` has been removed` : `Component \`${slug}\` is not drifting anymore`;

      octokit.rest.issues.createComment({
        ...repository,
        issue_number: issueNumber,
        body: comment,
      });

      core.info(`Issue ${issueNumber} for component ${slug} has been closed with comment: ${comment}`);
    }
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

const createIssues = async (octokit, context, maxOpenedIssues, users, componentsToIssues, componentsCandidatesToCreateIssue, componentsCandidatesToCloseIssue) => {
    const repository = context.repo;
    const numberOfMaximumPotentialIssuesThatCanBeCreated = Math.max(0, maxOpenedIssues - Object.keys(componentsToIssues).length + componentsCandidatesToCloseIssue.length);
    const numOfIssuesToCreate = Math.min(numberOfMaximumPotentialIssuesThatCanBeCreated, componentsCandidatesToCreateIssue.length);
    const componentsToNewlyCreatedIssues = {};

    for (let i = 0; i < numOfIssuesToCreate; i++) {
        const slug = componentsCandidatesToCreateIssue[i];
        const issueTitle = `Drift Detected in \`${slug}\``;
        const issueDescription = fs.readFileSync(`issue-description-${slug}.md`, 'utf8');
    
        const newIssue = await octokit.rest.issues.create({
            ...repository,
            title: issueTitle,
            body: issueDescription,
            labels: ["drift"]
        });

        const issueNumber = newIssue.data.number;

        componentsToNewlyCreatedIssues[slug] = issueNumber;

        core.info(`Created new issue with number: ${issueNumber}`);

        core.setOutput('issue-number', issueNumber);

        if (users.length > 0) {
            try {
                await octokit.rest.issues.addAssignees({
                    ...repository,
                    issue_number: issueNumber,
                    assignees: users
                });
            } catch (error) {
                core.error(`Failed to associate user to an issue. Error ${error.message}`);
            }
        }
    }

    return componentsToNewlyCreatedIssues;
}

const updateIssues = async (octokit, context, componentsToIssues, componentsToUpdateExistingIssue) => {
    const repository = context.repo;

    for (let i = 0; i < componentsToUpdateExistingIssue.length; i++) {
      const slug = componentsToUpdateExistingIssue[i];
      const issueDescription = fs.readFileSync(`issue-description-${slug}.md`, 'utf8');
      const issueNumber = componentsToIssues[slug];

      octokit.rest.issues.update({
        ...repository,
        issue_number: issueNumber,
        body: issueDescription
      });

      core.info(`Updated issue: ${issueNumber}`);
    }
}

const postDriftDetectionSummary = async (context, maxOpenedIssues, componentsToIssues, componentsToNewlyCreatedIssues, componentsCandidatesToCreateIssue, removedComponents, recoveredComponents, driftingComponents) => {
    const orgName = context.repo.owner;
    const repo = context.repo.repo;
    const runId = github.context.runId;

    const table = [[{data: 'Component', header: true}, {data: 'State', header: true}, {data: 'Comments', header: true}]];

    for (let slug of Object.keys(componentsToNewlyCreatedIssues)) {
      const issueNumber = componentsToNewlyCreatedIssues[slug];

      table.push([`<a href="https://github.com/${orgName}/${repo}/actions/runs/${runId}#${slug}">${slug}</a>`, '<img src="https://shields.io/badge/CREATED-brightgreen?style=for-the-badge"/>', `New component. Created new issue <a href="https://github.com/${orgName}/${repo}/issues/${issueNumber}">#${issueNumber}</a>`]);
    }

    for (let i = 0; i < componentsCandidatesToCreateIssue.length; i++) {
      const slug = componentsCandidatesToCreateIssue[i];

      if (!componentsToNewlyCreatedIssues.hasOwnProperty(slug)) {
        table.push([`<a href="https://github.com/${orgName}/${repo}/actions/runs/${runId}#${slug}">${slug}</a>`, '<img src="https://shields.io/badge/CREATED-brightgreen?style=for-the-badge"/>', `New component. Issue was not created because maximum number of created issues ${maxOpenedIssues} reached`]);
      }
    }

    for (let i = 0; i < removedComponents.length; i++) {
      const slug = removedComponents[i];
      const issueNumber = componentsToIssues[slug];

      table.push([`<a href="https://github.com/${orgName}/${repo}/actions/runs/${runId}#${slug}">${slug}</a>`, '<img src="https://shields.io/badge/REMOVED-grey?style=for-the-badge"/>', `Component has been removed. Closed issue <a href="https://github.com/${orgName}/${repo}/issues/${issueNumber}">#${issueNumber}</a>`]);
    }

    for (let i = 0; i < recoveredComponents.length; i++) {
      const slug = recoveredComponents[i];
      const issueNumber = componentsToIssues[slug];

      table.push([`<a href="https://github.com/${orgName}/${repo}/actions/runs/${runId}#${slug}">${slug}</a>`, '<img src="https://shields.io/badge/RECOVERED-grey?style=for-the-badge"/>', `Component recovered. Closed issue <a href="https://github.com/${orgName}/${repo}/issues/${issueNumber}">#${issueNumber}</a>`]);
    }

    for (let i = 0; i < driftingComponents.length; i++) {
      const slug = driftingComponents[i];
      const issueNumber = componentsToIssues[slug];

      if (componentsCandidatesToCreateIssue.indexOf(slug) === -1) {
        table.push([`<a href="https://github.com/${orgName}/${repo}/actions/runs/${runId}#${slug}">${slug}</a>`, '<img src="https://shields.io/badge/DRIFTED-important?style=for-the-badge"/>', `Component drifted. Issue already exists <a href="https://github.com/${orgName}/${repo}/issues/${issueNumber}">#${issueNumber}</a>`]);
      }
    }

    if (table.length > 1) {
      await core.summary
        .addHeading('Drift Detection Summary')
        .addTable(table)
        .write()
    } else {
      await core.summary.addRaw("No drift detected").write();
    }
}

const postStepSummaries = async (driftingComponents) => {
    for (let i = 0; i < driftingComponents.length; i++) {
      const slug = driftingComponents[i];
      const file = `step-summary-${slug}.md`;
      const content = fs.readFileSync(file, 'utf-8');

      await core.summary.addRaw(content).write();
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
    } = parameters;

    await downloadArtifacts("metadata");

    const openGitHubIssuesToComponents = await mapOpenGitHubIssuesToComponents(octokit, context);
    const componentsToIssueNumber = openGitHubIssuesToComponents.componentsToIssues;
    const componentsToIssueMetadata = openGitHubIssuesToComponents.componentsToMetadata;

    const metadataFromPlanArtifacts = await readMetadataFromPlanArtifacts();
    const componentsToPlanState = metadataFromPlanArtifacts.componentsToState;

    const triageResults = await triage(componentsToIssueNumber, componentsToIssueMetadata, componentsToPlanState);
    const componentsCandidatesToCreateIssue = triageResults.componentsCandidatesToCreateIssue;
    const componentsToUpdateExistingIssue = triageResults.componentsToUpdateExistingIssue;
    const removedComponents = triageResults.removedComponents;
    const recoveredComponents = triageResults.recoveredComponents;
    const driftingComponents = triageResults.driftingComponents;
    const componentsCandidatesToCloseIssue = triageResults.componentsCandidatesToCloseIssue;

    await closeIssues(octokit, context, componentsToIssueNumber, removedComponents, recoveredComponents);

    const usersFromTeams = await convertTeamsToUsers(octokit, context.repo.owner, assigneeTeams);
    let users = assigneeUsers.concat(usersFromTeams);
    users = [...new Set(users)]; // get unique set

    const componentsToNewlyCreatedIssues = await createIssues(octokit, context, maxOpenedIssues, users, componentsToIssueNumber, componentsCandidatesToCreateIssue, componentsCandidatesToCloseIssue);

    await updateIssues(octokit, context, componentsToIssueNumber, componentsToUpdateExistingIssue);

    await postDriftDetectionSummary(context, maxOpenedIssues, componentsToIssueNumber, componentsToNewlyCreatedIssues, componentsCandidatesToCreateIssue, removedComponents, recoveredComponents, driftingComponents);

    await postStepSummaries(driftingComponents);
};

module.exports = {
    runAction
};
