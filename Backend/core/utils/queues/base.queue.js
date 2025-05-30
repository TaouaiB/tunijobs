const { Queue, Worker, QueueScheduler, JobsOptions } = require('bullmq');
const redisClient = require('../redis/redis.client');
const logger = require('../logger/logger');

/**
 * @abstract
 * @class BaseQueue
 * @description Abstract base class for BullMQ queues.
 */
class BaseQueue {
  /**
   * 
   * @param {string} queueName - The name of the queue
   * @param {object} [options] - BullMQ Queue options
   */
  constructor(queueName, options = {}) {
    if (new.target === BaseQueue) {
      throw new TypeError('Cannot instantiate BaseQueue directly');
    }
    this.queueName = queueName;
    this.queue = new Queue(queueName, {
      connection: redisClient.client,
      ...options,
    });
    this.scheduler = new QueueScheduler(queueName, {
      connection: redisClient.client,
    });
    this.worker = null;

    this.setupListeners();
  }

  /**
   * Add a job to the queue
   * @param {string} name - Job name
   * @param {object} data - Job payload
   * @param {JobsOptions} [opts] - Optional BullMQ job options
   */
  async addJob(name, data, opts = {}) {
    try {
      const job = await this.queue.add(name, data, opts);
      logger.info(`Job added to ${this.queueName} - ${name}`, { jobId: job.id });
      return job;
    } catch (err) {
      logger.error(`Failed to add job to ${this.queueName}`, { error: err.message });
      throw err;
    }
  }

  /**
   * Abstract method to initialize worker processing
   * Subclasses must override this method.
   */
  initWorker() {
    throw new Error('initWorker() must be implemented in subclass');
  }

  /**
   * Setup basic event listeners on queue and worker
   */
  setupListeners() {
    this.queue.on('completed', (job) => {
      logger.info(`Job completed in ${this.queueName}`, { jobId: job.id, name: job.name });
    });

    this.queue.on('failed', (job, err) => {
      logger.error(`Job failed in ${this.queueName}`, { jobId: job.id, name: job.name, error: err.message });
    });

    if (this.worker) {
      this.worker.on('error', (err) => {
        logger.error(`Worker error in ${this.queueName}`, { error: err.message });
      });
    }
  }

  /**
   * Gracefully close the queue, scheduler, and worker
   */
  async close() {
    try {
      await this.queue.close();
      await this.scheduler.close();
      if (this.worker) await this.worker.close();
      logger.info(`Queue ${this.queueName} closed gracefully`);
    } catch (err) {
      logger.error(`Error closing queue ${this.queueName}`, { error: err.message });
    }
  }
}

module.exports = BaseQueue;
