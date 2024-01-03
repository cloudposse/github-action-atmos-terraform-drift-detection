const {None} = require("../results/none");

class Nothing {
    constructor() {
    }

    async run() {
        return new None();
    }

    summary() {
        return "";
    }

    shortSummary() {
        return "";
    }
}


module.exports = {
    Nothing
}