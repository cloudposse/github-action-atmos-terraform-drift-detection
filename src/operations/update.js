const core = require("@actions/core");
const {readFileSync} = require("fs");
const {Exists} = require("../results/exists");
const {getFileName} = require("../utils");

class Update {
    constructor(issue, state, labels) {
        this.issue = issue;
        this.state = state;
        this.labels = labels;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const orgName = repository.owner;
        const repo = repository.repo;
        const runId = context.runId;

        const slug = this.state.slug;
        const file_name = getFileName(slug)
        const issueTitle = this.state.error ? `Failure Detected in \`${slug}\`` : `Drift Detected in \`${slug}\``;
        const issueDescription = readFileSync(`issue-description-${file_name}.md`, 'utf8');
        const issueNumber = this.issue.number;
        const label = this.state.error ? "error" : "drift"

        const body = [
            issueDescription,
            "# Related",
            `* [:building_construction: Action Workflow Logs](/${orgName}/${repo}/actions/runs/${runId})`
        ]

        if (context.payload.pull_request != null) {
            body.push(`* #${context.payload.pull_request.number}`);
        }

        try {
            // Await the update call and log progress
            await octokit.rest.issues.update({
                ...repository,
                issue_number: issueNumber,
                title: issueTitle,
                body: body.join("\n"),
                labels: [label].concat(this.labels)
            });

            core.info(`Updated issue ${issueNumber} for ${slug}`);
        } catch (error) {
            core.error(`Failed to update issue ${issueNumber}: ${error.message}`);
        }

        return new Exists(context, repository, issueNumber, this.state)
    }

    isVisible() {
        return true
    }
}


module.exports = {
    Update
}