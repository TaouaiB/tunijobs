const cron = require('node-cron');
const { createCronJob } = require('./cronFactory');
const jobService = require('../../modules/job/services/job.service');
const ApiError = require('../utils/ApiError');

// const testCron = cron.schedule('*/2 * * * *', async () => {
//   console.log('Running auto unfeature jobs test every 2 minutes');
//   try {
//     await jobService.autoUnfeatureJobsTest();
//   } catch (error) {
//     console.error('Error in auto unfeature test:', error.message);
//   }
// });

// Main cron job function
async function autoUnfeatureExpiredJobs() {
  const expirationDays = 7;
  const expirationDate = new Date(
    Date.now() - expirationDays * 24 * 60 * 60 * 1000
  );

  const jobsToUnfeature =
    await jobService.findFeaturedJobsOlderThan(expirationDate);

  for (const job of jobsToUnfeature) {
    try {
      await jobService.unfeatureJobById(job._id);
    } catch (error) {
      throw new ApiError(
        `Failed to unfeature job ${job._id}: ${error.message}`,
        500
      );
    }
  }
}

// Main cron job (runs daily at midnight)
const autoUnfeatureJobTask = createCronJob(
  '0 0 * * *',
  autoUnfeatureExpiredJobs
);

module.exports = { autoUnfeatureJobTask };
