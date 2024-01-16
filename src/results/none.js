class None {
    constructor(context, repository, newIssue, state) {
        this.runId = context.runId;
        this.repository = repository;
        this.newIssue = newIssue;
        this.state = state;
    }

    render() {
        return ""
    }

}


module.exports = {
    None
}