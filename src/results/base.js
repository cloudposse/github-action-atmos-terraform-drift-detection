/**
 * Abstract Class.
 */
class Base {

  constructor() {
    if (this.constructor === Base) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  render() {
    throw new Error("Method 'render()' must be implemented.");
  }

  summary() {
    throw new Error("Method 'summary()' must be implemented.");
  }

  shortSummary() {
    throw new Error("Method 'shortSummary()' must be implemented.");
  }
}

module.exports = {
  Base
}