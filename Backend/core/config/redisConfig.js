/**
 * Redis Configuration Loader
 * Centralized config with environment variables and sane defaults.
 */

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3,
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 5000,
  retryStrategy: (times) => Math.min(times * 100, 5000), // exponential backoff capped at 5s
};

module.exports = redisConfig;
