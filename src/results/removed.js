const {Base} = require("./base");

class Removed extends Base {
    constructor(context, repository, newIssueNumber, issue) {
        super();
        this.runId = context.runId;
        this.repository = repository;
        this.newIssueNumber = newIssueNumber;
        this.issue = issue;
    }

    render() {
        const slug = this.issue.slug;
        const orgName = this.repository.owner;
        const repo = this.repository.repo;
        const runId = this.runId;
        const issueNumber = this.newIssueNumber;
        const component = `[${slug}](/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug})`;
        const state = `![removed](https://shields.io/badge/REMOVED-grey?style=for-the-badge "Removed")`;
        const comments = `Component has been removed. Closed issue [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})`;

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
    Removed
}