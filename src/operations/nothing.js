const {None} = require("../results/none");

class Nothing {
    constructor() {
    }

    async run() {
        return new None();
    }

    isVisible() {
        return false
    }
}


module.exports = {
    Nothing
}