const core = require('@actions/core');
const github = require('@actions/github');
const { runAction } = require('./action');
const { parseIntInput, parseCsvInput } = require('./utils');

try {
    // Get params
    const token = core.getInput('token');
    const maxOpenedIssues = parseIntInput(core.getInput('max-opened-issues'));
    const assigneeUsers = parseCsvInput(core.getInput('assignee-users'));
    const assigneeTeams = parseCsvInput(core.getInput('assignee-teams'));

    // Get octokit
    const octokit = github.getOctokit(token);

    // Run action
    runAction(octokit, github.context, {
        maxOpenedIssues,
        assigneeUsers,
        assigneeTeams
    });
} catch (error) {
    core.setFailed(error.message);
}
