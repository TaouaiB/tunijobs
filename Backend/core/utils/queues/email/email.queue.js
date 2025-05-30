const BaseQueue = require('../base.queue');

class EmailQueue extends BaseQueue {
  constructor() {
    super('email'); // queue name
  }
}

module.exports = new EmailQueue();
