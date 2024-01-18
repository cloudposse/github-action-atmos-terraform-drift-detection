const {Base} = require("./base");
const {getFileName} = require("../utils");
const {readFileSync} = require("fs");

class NewCreated extends Base {
    constructor(context, repository, newIssueNumber, state) {
        super();
        this.runId = context.runId;
        this.repository = repository;
        this.newIssueNumber = newIssueNumber;
        this.state = state;
    }

    render(commentMode) {
        const slug = this.state.slug;
        const orgName = this.repository.owner;
        const repo = this.repository.repo;
        const runId = this.runId;
        const issueNumber = this.newIssueNumber;
        const component = `[${slug}](/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug})`;

        if (commentMode) {
            return `* #${issueNumber} (issue created)`
        }

        const state = this.state.error ?
          '![failed](https://shields.io/badge/FAILED-ff0000?style=for-the-badge "Failed")' :
          '![drifted](https://shields.io/badge/DRIFTED-important?style=for-the-badge "Drifted")';
        const comments = this.state.error ?
            `Failure detected. Created new issue [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})` :
            `Drift detected. Created new issue [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})`;

        return [component, state, comments].join(" | ");
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
    NewCreated
}