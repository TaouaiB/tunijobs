const cron = require('node-cron');
const logger = require('../utils/logger/logger');
const ApiError = require('../utils/ApiError');

/**
 * Create and start a cron job with standardized error handling and logging
 * @param {string} schedule - Cron schedule string (e.g. '0 0 * * *')
 * @param {Function} jobFunction - Async function to run on schedule
 */
function createCronJob(schedule, jobFunction) {
  const task = cron.schedule(schedule, async () => {
    try {
      logger.info(`[CronJob] Starting job at schedule: ${schedule}`);
      await jobFunction();
      logger.info(`[CronJob] Successfully finished job at schedule: ${schedule}`);
    } catch (error) {
      // If error is not an instance of ApiError, wrap it in one
      if (!(error instanceof ApiError)) {
        const apiError = new ApiError(error.message || 'Unexpected cron job error', 500);
        logger.error(`[CronJob] ApiError: ${apiError.message}`);
      } else {
        logger.error(`[CronJob] ApiError: ${error.message}`);
      }
    }
  });

  task.start();
  return task;
}

module.exports = { createCronJob };
