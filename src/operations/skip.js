const {None} = require("../results/none");

class Skip {
    constructor(issue, state) {
        this.issue = issue;
        this.state = state;
    }

    async run() {
        return new None();
    }

    summary() {
        return "";
    }
}


module.exports = {
    Skip
}