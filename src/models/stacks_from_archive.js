class StackFromArchive {
  constructor(metadata) {
    this.metadata = metadata;
    this.drifted = metadata.drifted;
    this.error = metadata.error;
    this.slug = `${metadata.stack}-${metadata.component}`;
  }
}

module.exports = {
  StackFromArchive,
}
