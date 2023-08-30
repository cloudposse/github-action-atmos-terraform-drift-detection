const parseCsvInput = (valueString) => {
    return valueString
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');
};

const parseIntInput = (valueString, defaultValue = 0) => {
    let value = defaultValue;
    if (valueString) {
        value = parseInt(valueString, 10);
        if (isNaN(value)) {
            throw new Error(`Invalid integer value: ${valueString}`);
        }
    }
    return value;
};

module.exports = {
    parseCsvInput,
    parseIntInput
};
