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
            // Override default retry behavior, because by default, 403 is not retried,
            // but secondary rate limiting is a 403.
            // 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found,
            // 410 Gone, 422 Unprocessable Entity, 451 Unavailable For Legal Reasons
            doNotRetry: [400, 401, 404, 410, 422, 451],
            retries: 4,
            // Retry after 25 seconds for secondary rate limiting.
            // If the retry-after header is present, that value will be used instead.
            retryAfter: 25
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
