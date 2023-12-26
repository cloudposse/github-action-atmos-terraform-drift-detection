const core = require("@actions/core");
const {readFileSync} = require("fs");
const {Exists} = require("../results/exists");

class Update {
    constructor(issue, state) {
        this.issue = issue;
        this.state = state;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const slug = this.state.slug;
        const file_name = slug.replace("/", "_")
        const issueDescription = readFileSync(`issue-description-${file_name}.md`, 'utf8');
        const issueNumber = this.issue.number;

        octokit.rest.issues.update({
            ...repository,
            issue_number: issueNumber,
            body: issueDescription
        });

        core.info(`Updated issue: ${issueNumber}`);

        return new Exists(context.runId, repository, issueNumber, this.state)
    }

    summary() {
        const file_name = this.state.slug.replace("/", "_")
        const file = `step-summary-${file_name}.md`;
        return readFileSync(file, 'utf-8');
    }
}


module.exports = {
    Update
}