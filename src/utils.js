const artifact = require('@actions/artifact');
const core = require('@actions/core');

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

const downloadArtifacts = () => {
    try {
        const artifactClient = artifact.create()
        const artifactName = 'metadata';
    
        // Downloading the artifact
        const downloadResponse = artifactClient.downloadArtifact(artifactName, __dirname);

        core.info(`Artifact ${artifactName} downloaded to ${downloadResponse.downloadPath}`);
      } catch (error) {
        throw new Error(`Failed to download artifacts: ${error.message}`);
      }
};

module.exports = {
    parseCsvInput,
    parseIntInput,
    downloadArtifacts,
};
