const core = require('@actions/core');
const {
    downloadArtifacts,
} = require('./utils');

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

    core.info(`maxOpenedIssues=${maxOpenedIssues}`);
    core.info(`assigneeUsers=${assigneeUsers}`);
    core.info(`assigneeTeams=${assigneeTeams}`);

    downloadArtifacts();
};

module.exports = {
    runAction
};
