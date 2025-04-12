const core = require("@actions/core");
const {Recovered} = require("../results/recovered");
const { wrapWithRetry } = require("../utils/retry");

// Helper function for pausing execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Close {
    constructor(issue, state) {
        this.issue = issue;
        this.state = state;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const slug = this.issue.slug;
        const issueNumber = this.issue.number;

        let step = "close";
        try {
            await wrapWithRetry(() =>
                octokit.rest.issues.update({
                    ...repository,
                    issue_number: issueNumber,
                    state: "closed"
                })
            );

            // GitHub support advises:
            // Pause Between Mutative Requests:
            //   For POST, PATCH, PUT, or DELETE requests (like modifying issues or labels),
            //   wait at least 1 second between each  request.
            await sleep(1350);

            const label = this.issue.error ? 'error-recovered' : 'drift-recovered';
            step = "label";

            await wrapWithRetry(() =>
                octokit.rest.issues.addLabels({
                    ...repository,
                    issue_number: issueNumber,
                    labels: [label]
                })
            );

            await sleep(1350);

            step = "comment on";
            let comment = this.issue.error ? `Failure \`${slug}\` solved` : `Component \`${slug}\` is not drifting anymore`;
            await wrapWithRetry(() =>
                octokit.rest.issues.createComment({
                    ...repository,
                    issue_number: issueNumber,
                    body: comment,
                })
            );

            core.info(`Issue ${issueNumber} for has been closed with comment: ${comment}`);
        } catch (error) {
            core.error(`Failed to ${step} issue ${issueNumber}:\n\t${error.message}`);
            throw error;
        }

        return new Recovered(context, repository, issueNumber, this.state)
    }

    isVisible() {
        return true
    }

}


module.exports = {
    Close
}