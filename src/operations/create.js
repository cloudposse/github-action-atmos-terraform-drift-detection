const core = require("@actions/core");
const {NewCreated} = require("../results/new-created");
const {readFileSync} = require("fs");
const {getFileName} = require("../utils");

class Create {
    constructor(state, users, labels) {
        this.state = state;
        this.users = users;
        this.labels = labels;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const orgName = repository.owner;
        const repo = repository.repo;
        const runId = context.runId;

        const slug = this.state.slug;
        const issueTitle = this.state.error ? `Failure Detected in \`${slug}\`` : `Drift Detected in \`${slug}\``;
        const file_name = getFileName(slug);
        const issueDescription = readFileSync(`issue-description-${file_name}.md`, 'utf8');

        const body = [
            issueDescription,
            "# Related",
            `* [:building_construction: Action Workflow Logs](/${orgName}/${repo}/actions/runs/${runId})`
        ]

        if (context.payload.pull_request != null) {
            body.push(`* #${context.payload.pull_request.number}`);
        }

        const label = this.state.error ? "error" : "drift"

        const newIssue = await octokit.rest.issues.create({
            ...repository,
            title: issueTitle,
            body: body.join("\n"),
            labels: [label].concat(this.labels)
        });

        const issueNumber = newIssue.data.number;

        core.info(`Created new issue with number: ${issueNumber}`);

        if (this.users.length > 0) {
            try {
                await octokit.rest.issues.addAssignees({
                    ...repository,
                    issue_number: issueNumber,
                    assignees: this.users
                });
            } catch (error) {
                core.error(`Failed to associate user to an issue. Error ${error.message}`);
            }
        }

        return new NewCreated(runId, repository, issueNumber, this.state);
    }

    summary() {
        const file_name = getFileName(this.state.slug);
        const file = `step-summary-${file_name}.md`;
        return readFileSync(file, 'utf-8');
    }

    shortSummary() {
        const component = this.state.metadata.component;
        const stack = this.state.metadata.stack;
        const title = this.state.error ?
          `## Plan Failed for \`${component}\` in \`${stack}\`` :
          `## Changes Found for \`${component}\` in \`${stack}\``;
        const body = `Summary is unavailable due to [GitHub size limitation](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#step-isolation-and-limits) on job summaries. Please check the GitHub Action run logs for more details.`
        return [title, body].join("\n");
    }
}


module.exports = {
    Create
}