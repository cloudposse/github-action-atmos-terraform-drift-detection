const core = require("@actions/core");
const {Recovered} = require("../results/recovered");

class Close {
    constructor(issue, state) {
        this.issue = issue;
        this.state = state;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const slug = this.issue.slug;
        const issueNumber = this.issue.number;

        octokit.rest.issues.update({
            ...repository,
            issue_number: issueNumber,
            state: "closed"
        });

        const label = this.issue.error ? 'error-recovered' : 'drift-recovered';

        octokit.rest.issues.addLabels({
            ...repository,
            issue_number: issueNumber,
            labels: [label]
        });

        let comment = this.issue.error ? `Failure \`${slug}\` solved` : `Component \`${slug}\` is not drifting anymore`;
        octokit.rest.issues.createComment({
            ...repository,
            issue_number: issueNumber,
            body: comment,
        });

        core.info(`Issue ${issueNumber} for component ${slug} has been closed with comment: ${comment}`);

        return new Recovered(context.runId, repository, this.issue, this.state)
    }

    summary() {
        return "";
    }

}


module.exports = {
    Close
}