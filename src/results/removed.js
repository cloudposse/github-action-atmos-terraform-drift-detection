class Removed {
    constructor(runId, repository, newIssue, state) {
        this.runId = runId;
        this.repository = repository;
        this.newIssue = newIssue;
        this.state = state;
    }

    render() {
        const slug = this.state.slug;
        const orgName = this.repository.owner;
        const repo = this.repository.repo;
        const runId = this.runId;
        const issueNumber = this.newIssue.data.number;
        const component = `[${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug})`;
        const state = `![removed](https://shields.io/badge/REMOVED-grey?style=for-the-badge "Removed")`;
        const comments = `Component has been removed. Closed issue [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber})`;

        return [component, state, comments].join(" | ");
    }

}


module.exports = {
    Removed
}