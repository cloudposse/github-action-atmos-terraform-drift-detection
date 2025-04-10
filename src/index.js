const core = require('@actions/core');
const github = require('@actions/github');
const { retry } = require("@octokit/plugin-retry");
const { runAction } = require('./action');
const { parseIntInput, parseCsvInput } = require('./utils');

try {
    // Get params
    const token = core.getInput('token');
    const maxOpenedIssues = parseIntInput(core.getInput('max-opened-issues'));
    const assigneeUsers = parseCsvInput(core.getInput('assignee-users'));
    const assigneeTeams = parseCsvInput(core.getInput('assignee-teams'));
    const labels        = parseCsvInput(core.getInput('labels'));
    const processAll    = core.getBooleanInput('process-all');

    // Get octokit with retry plugin
    const octokit = github.getOctokit(token, {
        retry: {
            enabled: true,
            retries: 3,
            doNotRetry: ['429'],
            retryAfter: 5
        }
    }, retry);

    // Run action
    runAction(octokit, github.context, {
        maxOpenedIssues,
        assigneeUsers,
        assigneeTeams,
        labels,
        processAll
    });
} catch (error) {
    core.setFailed(error.message);
}
