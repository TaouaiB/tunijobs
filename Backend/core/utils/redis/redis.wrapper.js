const logger = require('../logger/logger');
const redisConfig = require('../../config/redisConfig');
/**
 * @class RedisWrapper
 * @description Higher-level Redis utility for common operations with logging and error handling.
 */
class RedisWrapper {
  constructor() {
    this.client = redisClient.client;
  }

  /**
   * Set a key with optional TTL (in seconds)
   * @param {string} key
   * @param {string} value
   * @param {number} [ttl] - Time to live in seconds
   */
  async set(key, value, ttl) {
    try {
      if (ttl) {
        await this.client.set(key, value, 'EX', ttl);
      } else {
        await this.client.set(key, value);
      }
      logger.debug(`Redis SET key=${key} ttl=${ttl || 'none'}`);
      return true;
    } catch (err) {
      logger.error('Redis SET error', { key, error: err.message });
      throw err;
    }
  }

  /**
   * Get value by key
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      logger.debug(`Redis GET key=${key}`);
      return value;
    } catch (err) {
      logger.error('Redis GET error', { key, error: err.message });
      throw err;
    }
  }

  /**
   * Delete one or more keys
   * @param  {...string} keys
   * @returns {Promise<number>} number of keys deleted
   */
  async del(...keys) {
    try {
      const count = await this.client.del(...keys);
      logger.debug(`Redis DEL keys=${keys.join(',')}`);
      return count;
    } catch (err) {
      logger.error('Redis DEL error', { keys, error: err.message });
      throw err;
    }
  }

  /**
   * Publish a message to a channel
   * @param {string} channel
   * @param {string} message
   */
  async publish(channel, message) {
    try {
      await this.client.publish(channel, message);
      logger.debug(`Redis PUBLISH channel=${channel} message=${message}`);
    } catch (err) {
      logger.error('Redis PUBLISH error', { channel, error: err.message });
      throw err;
    }
  }

  /**
   * Subscribe to a channel with a message handler
   * @param {string} channel
   * @param {(message: string) => void} handler
   */
  subscribe(channel, handler) {
    const subscriber = new this.client.constructor(this.client.options);

    subscriber.subscribe(channel, (err, count) => {
      if (err) {
        logger.error('Redis SUBSCRIBE error', { channel, error: err.message });
        return;
      }
      logger.info(`Subscribed to Redis channel: ${channel}`);
    });

    subscriber.on('message', (chan, message) => {
      if (chan === channel) {
        try {
          handler(message);
        } catch (handlerErr) {
          logger.error('Redis SUBSCRIBE handler error', {
            channel,
            error: handlerErr.message,
          });
        }
      }
    });

    return subscriber; // Return subscriber so caller can unsubscribe if needed
  }
}

module.exports = new RedisWrapper();
