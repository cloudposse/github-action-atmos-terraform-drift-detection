const {None} = require("../results/none");

class Nothing {
    constructor() {
    }

    async run() {
        return new None();
    }
}


module.exports = {
    Nothing
}