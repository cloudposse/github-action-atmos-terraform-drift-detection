const fs = require('fs');
const core = require('@actions/core');
const {
    downloadArtifacts,
} = require('./utils');

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
        const drifted = metadata.drifted;

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

/**
 * @param {Object} octokit
 * @param {Object} context
 * @param {Object} parameters
 */
const runAction = async (octokit, context, parameters) => {
    const {
        maxOpenedIssues = 0,
        assigneeUsers = [],
        assigneeTeams = []
    } = parameters;

    downloadArtifacts("metadata");

    const openGitHubIssuesToComponents = await mapOpenGitHubIssuesToComponents(octokit, context);
    const componentsToIssueNumber = openGitHubIssuesToComponents.componentsToIssues;
    const componentsToIssueMetadata = openGitHubIssuesToComponents.componentsToMetadata;

    const metadataFromPlanArtifacts = await readMetadataFromPlanArtifacts();
    const componentsToPlanState = metadataFromPlanArtifacts.componentsToState;
    const componentsToPlanMetadata = metadataFromPlanArtifacts.componentsToMetadata;

    const triageResults = await triage(componentsToIssueNumber, componentsToIssueMetadata, componentsToPlanState);
    const componentsCandidatesToCreateIssue = triageResults.componentsCandidatesToCreateIssue;
    const componentsToUpdateExistingIssue = triageResults.componentsToUpdateExistingIssue;
    const removedComponents = triageResults.removedComponents;
    const recoveredComponents = triageResults.recoveredComponents;
    const driftingComponents = triageResults.driftingComponents;
    const componentsCandidatesToCloseIssue = triageResults.componentsCandidatesToCloseIssue;

    core.info(`Components candidates to create issue: ${componentsCandidatesToCreateIssue}`);
};

module.exports = {
    runAction
};
