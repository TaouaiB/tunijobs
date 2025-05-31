const IORedis = require('ioredis');
const logger = require('../logger/logger');
const redisConfig = require('../../config/redisConfig');

/**
 * @class RedisClient
 * @description Singleton Redis client with robust connection handling.
 */
class RedisClient {
  constructor(config = {}) {
    this.config = { ...redisConfig, ...config };

    this.client = null;
    this.initialize();
  }

  initialize() {
    if (this.client) return;

    this.client = new IORedis(this.config);

    this.client.on('connect', () =>
      logger.info('✅ Redis connected', {
        host: this.config.host,
        port: this.config.port,
      })
    );

    this.client.on('error', (err) =>
      logger.error('❌ Redis error', { error: err.message })
    );

    this.client.on('close', () => logger.warn('⚠️ Redis connection closed'));

    this.client.on('reconnecting', () =>
      logger.info('🔁 Redis reconnecting...')
    );
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('🛑 Redis disconnected gracefully');
      } catch (err) {
        logger.error('Failed to disconnect Redis', { error: err.message });
      } finally {
        this.client = null;
      }
    }
  }

  async isHealthy() {
    try {
      await this.client.ping();
      return true;
    } catch (err) {
      logger.error('Redis health check failed', { error: err.message });
      return false;
    }
  }

  static getInstance(config = {}) {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(config);
      logger.debug('Singleton RedisClient initialized');
    }
    return RedisClient.instance;
  }
}

module.exports = RedisClient.getInstance();
