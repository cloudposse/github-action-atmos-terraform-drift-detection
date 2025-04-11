const core = require("@actions/core");
const {Removed} = require("../results/removed");
const {wrapWithRetry} = require("../utils/retry");

// Helper function for pausing execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Remove {
    constructor(issue) {
        this.issue = issue;
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

            step = "label";
            await wrapWithRetry(() =>
                octokit.rest.issues.addLabels({
                    ...repository,
                    issue_number: issueNumber,
                    labels: ['removed']
                })
            );

            // Pause between API calls, to avoid hitting the secondary rate limit
            await sleep(1350);

            step = "comment on";
            const comment = `Component \`${slug}\` has been removed`;
            await wrapWithRetry(() =>
                octokit.rest.issues.createComment({
                    ...repository,
                    issue_number: issueNumber,
                    body: comment,
                })
            );

            core.info(`Issue ${issueNumber} for component ${slug} has been closed with comment: ${comment}`);
        } catch (error) {
            core.error(`Failed to ${step} issue ${issueNumber}:\n\t${error.message}`);
            throw error;
        }

        return new Removed(context, repository, issueNumber, this.issue);
    }

    isVisible() {
        return true
    }
}


module.exports = {
    Remove
}