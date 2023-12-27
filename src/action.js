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


// const downloadArtifacts = async (artifactName) => {
//     try {
//         const artifactClient = artifact.create()
//         const downloadDirectory = '.'
//
//         // Downloading the artifact
//         const downloadResponse = await artifactClient.downloadArtifact(artifactName, downloadDirectory);
//
//         core.info(`Artifact ${artifactName} downloaded to ${downloadResponse.downloadPath}`);
//       } catch (error) {
//         throw new Error(`Failed to download artifacts: ${error.message}`);
//       }
// };

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

// const readMetadataFromPlanArtifacts = async () => {
//     const files = fs.readdirSync('.');
//     const metadataFiles = files.filter(file => file.endsWith('metadata.json'));
//
//     let componentsToState = {};
//     let componentsToMetadata = {};
//
//     for (let i = 0; i < metadataFiles.length; i++) {
//         const metadata = JSON.parse(fs.readFileSync(metadataFiles[i], 'utf8'));
//
//         const slug = `${metadata.stack}-${metadata.component}`;
//
//         componentsToState[slug] = {
//             drifted: metadata.drifted,
//             error: metadata.error
//         };
//         componentsToMetadata[slug] = metadata;
//     }
//
//     return {
//         componentsToState: componentsToState,
//         componentsToMetadata: componentsToMetadata,
//     };
// }

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


const triage = async (componentsToIssue, componentsToPlanState, users, labels, maxOpenedIssues) => {

    const mode = "full"
    const fullComponents = mode === "full" ?
        [...componentsToIssue.keys(), ...componentsToPlanState.keys()] :
        [...componentsToPlanState.keys()]
    const slugs = new Set(fullComponents)

    // const numberOfMaximumPotentialIssuesThatCanBeCreated = Math.max(0, maxOpenedIssues - Object.keys(componentsToIssues).length + componentsCandidatesToCloseIssue.length);
    // const numOfIssuesToCreate = Math.min(numberOfMaximumPotentialIssuesThatCanBeCreated, componentsCandidatesToCreateIssue.length);

    const operations = [...slugs].map( (slug) => {
        const issue = componentsToIssue.get(slug)
        const state = componentsToPlanState.get(slug)
        if (issue && state) {
            if (state.error || state.drifted) {
                const commitSHA = issue.metadata.commitSHA;
                const currentSHA = "${{ github.sha }}";
                if (currentSHA === commitSHA) {
                    return new Skip(issue, state)
                } else {
                    return new Update(issue, state, labels)
                }
            } else {
                return new Close(issue, state)
            }
        } else if (issue) {
            // Added resolve to issue
            return new Remove(issue)
        } else if (state && ( state.error || state.drifted)) {
            return new Create(state, users, labels)
        } else {
            return new Nothing()
        }
    })

    const openedIssuesCounts = operations.filter( (operation) => {
        return operation instanceof Update
    }).length

    const closedIssuesCount = operations.filter( (operation) => {
        return operation instanceof Close || operation instanceof Remove
    }).length

    const numberOfMaximumPotentialIssuesThatCanBeCreated = Math.max(0, maxOpenedIssues - openedIssuesCounts + closedIssuesCount);
    let numOfIssuesToCreate = Math.min(numberOfMaximumPotentialIssuesThatCanBeCreated, maxOpenedIssues);

    console.log(maxOpenedIssues);
    console.log(openedIssuesCounts);
    console.log(closedIssuesCount);
    console.log(numOfIssuesToCreate);

    // const result = operations.map((operation) => {
    //     if ( operation instanceof Create  || operation instanceof Update ) {
    //         if (numOfIssuesToCreate > 0) {
    //             numOfIssuesToCreate -= 1
    //         }
    //     }
    //
    //     if ( operation instanceof Create && numOfIssuesToCreate === 0 ) {
    //         return new Skip(operation.issue, operation.state, maxOpenedIssues)
    //     }
    //
    //     return operation
    // })

    return operations

    // const componentsCandidatesToCreateIssue = [];
    // const componentsCandidatesToCloseIssue = [];
    // const componentsToUpdateExistingIssue = [];
    // const removedComponents = [];
    // const recoveredComponents = [];
    // const driftingComponents = [];
    // const erroredComponents = [];

    // for (let slug of slugs) {
    //     if (componentsToIssueNumber.hasOwnProperty(slug)) {
    //         const issueNumber = componentsToIssueNumber[slug].number;
    //
    //         // if (componentsToPlanState.hasOwnProperty(slug)) {
    //         //     // const drifted = componentsToPlanState[slug].drifted;
    //         //     // const error = componentsToPlanState[slug].error;
    //         //     //
    //         //     // if (drifted || error) {
    //         //     //     const commitSHA = componentsToIssueMetadata[slug].commitSHA;
    //         //     //     const currentSHA = "${{ github.sha }}";
    //         //     //     // if (currentSHA === commitSHA) {
    //         //     //     //     core.info(`Component "${slug}" marked as drifted but default branch SHA didn't change so nothing to update. Skipping ...`);
    //         //     //     //     if (error) {
    //         //     //     //         erroredComponents.push(slug)
    //         //     //     //     } else {
    //         //     //     //         driftingComponents.push(slug);
    //         //     //     //     }
    //         //     //     // } else {
    //         //     //     //     core.info(`Component "${slug}" is still drifting. Issue ${issueNumber} needs to be updated.`);
    //         //     //     //     componentsToUpdateExistingIssue.push(slug);
    //         //     //     //     if (error) {
    //         //     //     //         erroredComponents.push(slug)
    //         //     //     //     } else {
    //         //     //     //         driftingComponents.push(slug);
    //         //     //     //     }
    //         //     //     // }
    //         //     // } else {
    //         //     //     core.info(`Component "${slug}" is not drifting anymore. Issue ${issueNumber} needs to be closed.`);
    //         //     //     componentsCandidatesToCloseIssue.push(slug);
    //         //     //     recoveredComponents.push(slug);
    //         //     // }
    //         // } else {
    //         //     core.info(`Component "${slug}" has been removed. Issue ${issueNumber} needs to be closed.`);
    //         //     componentsCandidatesToCloseIssue.push(slug);
    //         //     removedComponents.push(slug);
    //         // }
    //     } else {
    //         const drifted = componentsToPlanState[slug].drifted;
    //         const error = componentsToPlanState[slug].error;
    //
    //         if (drifted) {
    //             core.info(`Component "${slug}" drifted. New issue has to be created.`);
    //             componentsCandidatesToCreateIssue.push(slug);
    //             driftingComponents.push(slug);
    //         } else if (error) {
    //             core.info(`Component "${slug}" drift error. New issue has to be created.`);
    //             componentsCandidatesToCreateIssue.push(slug);
    //             erroredComponents.push(slug);
    //         } else {
    //             core.info(`Component "${slug}" is not drifting. Skipping ...`);
    //         }
    //     }
    // }
    // return operations
    // return {
    //     componentsCandidatesToCreateIssue: componentsCandidatesToCreateIssue,
    //     componentsToUpdateExistingIssue: componentsToUpdateExistingIssue,
    //     removedComponents: removedComponents,
    //     recoveredComponents: recoveredComponents,
    //     driftingComponents: driftingComponents,
    //     erroredComponents: erroredComponents,
    //     componentsCandidatesToCloseIssue: componentsCandidatesToCloseIssue,
    // }
}

// const closeIssues = async (octokit, context, componentsToIssueNumber, removedComponents, recoveredComponents) => {
//     const componentsToCloseIssuesFor = removedComponents.concat(recoveredComponents);
//
//     const repository = context.repo;
//
//     for (let i = 0; i < componentsToCloseIssuesFor.length; i++) {
//       const slug = componentsToCloseIssuesFor[i];
//       const issueNumber = componentsToIssueNumber[slug].number;
//
//       octokit.rest.issues.update({
//         ...repository,
//         issue_number: issueNumber,
//         state: "closed"
//       });
//
//       if (componentsToIssueNumber[slug].error) {
//           octokit.rest.issues.addLabels({
//               ...repository,
//               issue_number: issueNumber,
//               labels: ['error-recovered']
//           });
//       } else {
//           octokit.rest.issues.addLabels({
//               ...repository,
//               issue_number: issueNumber,
//               labels: ['drift-recovered']
//           });
//       }
//
//       let comment =  `Component \`${slug}\` is not drifting anymore`;
//       if ( removedComponents.hasOwnProperty(slug) ) {
//           comment = `Component \`${slug}\` has been removed`;
//       } else if ( componentsToIssueNumber[slug].error ) {
//           comment =  `Failure \`${slug}\` solved`;
//       }
//
//       octokit.rest.issues.createComment({
//         ...repository,
//         issue_number: issueNumber,
//         body: comment,
//       });
//
//       core.info(`Issue ${issueNumber} for component ${slug} has been closed with comment: ${comment}`);
//     }
// }

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

// const createIssues = async (octokit, context, maxOpenedIssues, labels, users, componentsToIssues, componentsCandidatesToCreateIssue, componentsCandidatesToCloseIssue, erroredComponents) => {
//     const repository = context.repo;
//     const numberOfMaximumPotentialIssuesThatCanBeCreated = Math.max(0, maxOpenedIssues - Object.keys(componentsToIssues).length + componentsCandidatesToCloseIssue.length);
//     const numOfIssuesToCreate = Math.min(numberOfMaximumPotentialIssuesThatCanBeCreated, componentsCandidatesToCreateIssue.length);
//     const componentsToNewlyCreatedIssues = {};
//
//     for (let i = 0; i < numOfIssuesToCreate; i++) {
//         const slug = componentsCandidatesToCreateIssue[i];
//         const issueTitle = erroredComponents.includes(slug) ? `Failure Detected in \`${slug}\`` : `Drift Detected in \`${slug}\``;
//         const file_name = slug.replace("/", "_")
//         const issueDescription = fs.readFileSync(`issue-description-${file_name}.md`, 'utf8');
//
//         const label  = erroredComponents.includes(slug) ? "error" : "drift"
//
//         const newIssue = await octokit.rest.issues.create({
//             ...repository,
//             title: issueTitle,
//             body: issueDescription,
//             labels: [label].concat(labels)
//         });
//
//         const issueNumber = newIssue.data.number;
//
//         componentsToNewlyCreatedIssues[slug] = issueNumber;
//
//         core.info(`Created new issue with number: ${issueNumber}`);
//
//         core.setOutput('issue-number', issueNumber);
//
//         if (users.length > 0) {
//             try {
//                 await octokit.rest.issues.addAssignees({
//                     ...repository,
//                     issue_number: issueNumber,
//                     assignees: users
//                 });
//             } catch (error) {
//                 core.error(`Failed to associate user to an issue. Error ${error.message}`);
//             }
//         }
//     }
//
//     return componentsToNewlyCreatedIssues;
// }

// const updateIssues = async (octokit, context, componentsToIssues, componentsToUpdateExistingIssue) => {
//     const repository = context.repo;
//
//     for (let i = 0; i < componentsToUpdateExistingIssue.length; i++) {
//       const slug = componentsToUpdateExistingIssue[i];
//       const file_name = slug.replace("/", "_")
//       const issueDescription = fs.readFileSync(`issue-description-${file_name}.md`, 'utf8');
//       const issueNumber = componentsToIssues[slug].number;
//
//       octokit.rest.issues.update({
//         ...repository,
//         issue_number: issueNumber,
//         body: issueDescription
//       });
//
//       core.info(`Updated issue: ${issueNumber}`);
//     }
// }

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

    // for (let slug of Object.keys(componentsToNewlyCreatedIssues)) {
    //   const issueNumber = componentsToNewlyCreatedIssues[slug];
    //
    //   if (driftingComponents.includes(slug)) {
    //       table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![drifted](https://shields.io/badge/DRIFTED-important?style=for-the-badge "Drifted") | New drift detected. Created new issue [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber}) |`);
    //   } else if (erroredComponents.includes(slug)) {
    //       table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![failed](https://shields.io/badge/FAILED-ff0000?style=for-the-badge "Failed") | Failure detected. Created new issue [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber}) |`);
    //   }
    // }

    // for (let i = 0; i < componentsCandidatesToCreateIssue.length; i++) {
    //   const slug = componentsCandidatesToCreateIssue[i];
    //
    //   if (!componentsToNewlyCreatedIssues.hasOwnProperty(slug)) {
    //     if (driftingComponents.includes(slug)) {
    //       table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![drifted](https://shields.io/badge/DRIFTED-important?style=for-the-badge "Drifted") | New drift detected. Issue was not created because maximum number of created issues ${maxOpenedIssues} reached |`);
    //     } else if (erroredComponents.includes(slug)) {
    //       table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![failed](https://shields.io/badge/FAILED-ff0000?style=for-the-badge "Failed") | Failure detected. Issue was not created because maximum number of created issues ${maxOpenedIssues} reached |`);
    //     }
    //   }
    // }

    // for (let i = 0; i < removedComponents.length; i++) {
    //   const slug = removedComponents[i];
    //   const issueNumber = componentsToIssues[slug].number;
    //
    //   table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![removed](https://shields.io/badge/REMOVED-grey?style=for-the-badge "Removed") | Component has been removed. Closed issue [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber}) |`);
    // }

    // for (let i = 0; i < recoveredComponents.length; i++) {
    //   const slug = recoveredComponents[i];
    //   const issueNumber = componentsToIssues[slug].number;
    //   if (componentsToIssues[slug].error) {
    //       table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![recovered](https://shields.io/badge/RECOVERED-brightgreen?style=for-the-badge "Recovered") | Failure recovered. Closed issue [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber}) |`);
    //   } else {
    //       table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![recovered](https://shields.io/badge/RECOVERED-brightgreen?style=for-the-badge "Recovered") | Drift recovered. Closed issue [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber}) |`);
    //   }
    // }

    // for (let i = 0; i < driftingComponents.length; i++) {
    //   const slug = driftingComponents[i];
    //   if (componentsCandidatesToCreateIssue.indexOf(slug) === -1) {
    //       const issueNumber = componentsToIssues[slug].number;
    //       table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![drifted](https://shields.io/badge/DRIFTED-important?style=for-the-badge "Drifted") | Drift detected. Issue already exists [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber}) |`);
    //   }
    // }
    //
    // for (let i = 0; i < erroredComponents.length; i++) {
    //     const slug = erroredComponents[i];
    //     if (componentsCandidatesToCreateIssue.indexOf(slug) === -1) {
    //         const issueNumber = componentsToIssues[slug].number;
    //         table.push( `| [${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug}) | ![failed](https://shields.io/badge/FAILED-ff0000?style=for-the-badge "Failed") | Failure detected. Issue already exists [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber}) |`);
    //     }
    // }

    if (table.length > 1) {
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
    // for (let i = 0; i < components.length; i++) {
    //   const slug = components[i];
    //   const file_name = slug.replace("/", "_")
    //   const file = `step-summary-${file_name}.md`;
    //   const content = fs.readFileSync(file, 'utf-8');
    //
    //   await core.summary.addRaw(content).write();
    // }
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
        labels        = []
    } = parameters;

    const path = await downloadArtifacts("metadata");

    const openGitHubIssuesToComponents = await mapOpenGitHubIssuesToComponents(octokit, context, labels);
    // const componentsToIssueNumber = openGitHubIssuesToComponents.componentsToIssues;
    // const componentsToIssueMetadata = openGitHubIssuesToComponents.componentsToMetadata;

    const metadataFromPlanArtifacts = readMetadataFromPlanArtifacts(path);
    // const componentsToPlanState = metadataFromPlanArtifacts.componentsToState;

    const usersFromTeams = await convertTeamsToUsers(octokit, context.repo.owner, assigneeTeams);
    let users = assigneeUsers.concat(usersFromTeams);
    users = [...new Set(users)]; // get unique set

    const triageResults = await triage(openGitHubIssuesToComponents, metadataFromPlanArtifacts, users, labels, maxOpenedIssues);

    const results = await Promise.all(triageResults.map((operation) => {
        return operation.run(octokit, context)
    }))

    // const componentsCandidatesToCreateIssue = triageResults.componentsCandidatesToCreateIssue;
    // const componentsToUpdateExistingIssue = triageResults.componentsToUpdateExistingIssue;
    // const removedComponents = triageResults.removedComponents;
    // const recoveredComponents = triageResults.recoveredComponents;
    // const driftingComponents = triageResults.driftingComponents;
    // const erroredComponents = triageResults.erroredComponents;
    // const componentsCandidatesToCloseIssue = triageResults.componentsCandidatesToCloseIssue;

    // await closeIssues(octokit, context, componentsToIssueNumber, removedComponents, recoveredComponents);


    // const componentsToNewlyCreatedIssues = await createIssues(octokit, context, maxOpenedIssues, labels, users, componentsToIssueNumber, componentsCandidatesToCreateIssue, componentsCandidatesToCloseIssue, erroredComponents);
    //
    // await updateIssues(octokit, context, componentsToIssueNumber, componentsToUpdateExistingIssue);

    await postDriftDetectionSummary(context, results);

    postStepSummaries(triageResults);
};

module.exports = {
    runAction
};
