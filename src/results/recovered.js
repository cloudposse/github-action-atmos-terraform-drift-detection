const {Base} = require("./base");

class Recovered extends Base {
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
        const state = `![recovered](https://shields.io/badge/RECOVERED-brightgreen?style=for-the-badge "Recovered")`;

        if (commentMode) {
            return `* #${issueNumber} (issue resolved)`
        }

        const comments = this.state.error ?
            `Failure recovered. Closed issue [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})` :
            `Drift recovered. Closed issue [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})`;

        return [component, state, comments].join(" | ");
    }

    summary() {
        return "";
    }

    shortSummary() {
        return "";
    }
}


module.exports = {
    Recovered
}