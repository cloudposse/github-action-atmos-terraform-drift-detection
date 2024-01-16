class Removed {
    constructor(context, repository, newIssueNumber, issue) {
        this.runId = context.runId;
        this.prMode = context.payload.pull_request != null
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

}


module.exports = {
    Removed
}