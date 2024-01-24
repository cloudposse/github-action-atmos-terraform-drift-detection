const {Base} = require("./base");

class None extends Base {
    constructor() {
        super();
    }

    render() {
        return ""
    }

    summary() {
        return "";
    }

    shortSummary() {
        return "";
    }
}


module.exports = {
    None
}