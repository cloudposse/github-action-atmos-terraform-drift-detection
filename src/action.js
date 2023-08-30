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

    core.info(`components-to-issues: ${JSON.stringify(componentsToIssues, null, 4)}`);
    core.info(`components-to-metadata: ${JSON.stringify(componentsToMetadata, null, 4)}`);

    return {
        componentsToIssues: componentsToIssues,
        componentsToMetadata: componentsToMetadata,
    };
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
    const componentsToIssues = openGitHubIssuesToComponents.componentsToIssues;
    const componentsToMetadata = openGitHubIssuesToComponents.componentsToMetadata;

    core.info(`components-to-issues: ${JSON.stringify(componentsToIssues, null, 4)}`);
    core.info(`components-to-metadata: ${JSON.stringify(componentsToMetadata, null, 4)}`);
};

module.exports = {
    runAction
};
