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
}


module.exports = {
    Nothing
}