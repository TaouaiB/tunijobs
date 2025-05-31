// core/utils/queues/email/email.queue.js
const { Worker } = require('bullmq');
const BaseQueue = require('../base.queue');
const emailProcessor = require('./email.processor');

class EmailQueue extends BaseQueue {
  constructor() {
    super('email');
    this.initWorker();
  }

  initWorker() {
    this.worker = new Worker(this.queueName, emailProcessor, {
      connection: this.queue.connection,
      concurrency: 5,
    });

    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err);
    });
  }
}

module.exports = new EmailQueue();
