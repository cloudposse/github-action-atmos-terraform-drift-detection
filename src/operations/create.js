const core = require("@actions/core");
const {NewCreated} = require("../results/new-created");
const {readFileSync} = require("fs");

class Create {
    constructor(state, users, labels) {
        this.state = state;
        this.users = users;
        this.labels = labels;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const slug = this.state.slug;
        const issueTitle = this.state.error ? `Failure Detected in \`${slug}\`` : `Drift Detected in \`${slug}\``;
        const file_name = slug.replace("/", "_")
        const issueDescription = readFileSync(`issue-description-${file_name}.md`, 'utf8');

        const label = this.state.error ? "error" : "drift"

        const newIssue = await octokit.rest.issues.create({
            ...repository,
            title: issueTitle,
            body: issueDescription,
            labels: [label].concat(this.labels)
        });

        const issueNumber = newIssue.data.number;

        core.info(`Created new issue with number: ${issueNumber}`);

        if (this.users.length > 0) {
            try {
                await octokit.rest.issues.addAssignees({
                    ...repository,
                    issue_number: issueNumber,
                    assignees: this.users
                });
            } catch (error) {
                core.error(`Failed to associate user to an issue. Error ${error.message}`);
            }
        }

        return new NewCreated(context.runId, repository, issueNumber, this.state);
    }

    summary() {
        const file_name = this.state.slug.replace("/", "_")
        const file = `step-summary-${file_name}.md`;
        return readFileSync(file, 'utf-8');
    }

}


module.exports = {
    Create
}