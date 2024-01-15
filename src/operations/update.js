const core = require("@actions/core");
const {readFileSync} = require("fs");
const {Exists} = require("../results/exists");
const {getFileName} = require("../utils");

class Update {
    constructor(issue, state, labels) {
        this.issue = issue;
        this.state = state;
        this.labels = labels;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const orgName = repository.owner;
        const repo = repository.repo;
        const runId = context.runId;

        const slug = this.state.slug;
        const file_name = getFileName(slug)
        const issueTitle = this.state.error ? `Failure Detected in \`${slug}\`` : `Drift Detected in \`${slug}\``;
        const issueDescription = readFileSync(`issue-description-${file_name}.md`, 'utf8');
        const issueNumber = this.issue.number;
        const label = this.state.error ? "error" : "drift"

        const body = [
            issueDescription,
            "# Related",
            `* [Job](/${orgName}/${repo}/actions/runs/${runId})`
        ]

        if (context.payload.pull_request != null) {
            body.add(`* #${context.payload.pull_request.number}`);
        }

        octokit.rest.issues.update({
            ...repository,
            issue_number: issueNumber,
            title: issueTitle,
            body: body.join("\n"),
            labels: [label].concat(this.labels)
        });

        core.info(`Updated issue: ${issueNumber}`);

        return new Exists(runId, repository, issueNumber, this.state)
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
    Update
}