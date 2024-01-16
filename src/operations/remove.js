const core = require("@actions/core");
const {Removed} = require("../results/removed");

class Remove {
    constructor(issue) {
        this.issue = issue;
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

        octokit.rest.issues.addLabels({
            ...repository,
            issue_number: issueNumber,
            labels: ['removed']
        });

        const comment = `Component \`${slug}\` has been removed`;
        octokit.rest.issues.createComment({
            ...repository,
            issue_number: issueNumber,
            body: comment,
        });

        core.info(`Issue ${issueNumber} for component ${slug} has been closed with comment: ${comment}`);

        return new Removed(context, repository, issueNumber, this.issue);
    }

    summary() {
        return "";
    }
    shortSummary() {
        return "";
    }
}


module.exports = {
    Remove
}