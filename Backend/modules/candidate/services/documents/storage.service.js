const path = require('path');
const fs = require('fs-extra');
const resumeOutputDir = path.join(process.cwd(), 'uploads/candidates/resumes');
const Candidate = require('../../models/candidateModel');
const ApiError = require('../../../../core/utils/ApiError');
const cleanupFiles = require('../../../../core/utils/cleanupFiles');

module.exports = {
  /**
   * Store resume for a candidate
   * @param {string} userId
   * @param {Object} documentInfo - { path, url, originalName, mimetype, size }
   * @returns {Promise<Candidate>} Updated candidate
   * @throws {ApiError} If candidate not found
   */
  async storeResume(userId, documentInfo) {
    console.log('Received documentInfo:', documentInfo); // DEBUG LINE
    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(`Candidate profile for user ${userId} not found`, 404);
    }

    // Safe cleanup of previous file
    if (candidate.resumeFile?.url) {
      try {
        const filename = path.basename(candidate.resumeFile.url);
        const filePath = path.join(resumeOutputDir, filename);

        console.log('Attempting to delete:', filePath);
        await fs.unlink(filePath);
        console.log('Successfully deleted previous resume');
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.warn('Previous resume not found, may already be deleted');
        } else {
          console.error('File cleanup error:', err.message);
        }
      }
    }

    // Update with new resume data
    candidate.resumeFile = {
      name: documentInfo.originalName,
      type: documentInfo.mimetype,
      size: documentInfo.size,
      url: documentInfo.url,
      lastUpdated: new Date(),
    };

    await candidate.save();
    return candidate;
  },

  /**
   * Remove candidate resume
   * @param {string} userId
   * @returns {Promise<Candidate>} Updated candidate
   * @throws {ApiError} If candidate not found
   */
  async removeResume(userId) {
    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(`Candidate profile for user ${userId} not found`, 404);
    }

    if (candidate.resumeUrl) {
      const absolutePath = path.join(process.cwd(), candidate.resumeUrl);
      await cleanupFiles([absolutePath]);

      candidate.resumeUrl = undefined;
      candidate.resumeOriginalName = undefined;
      candidate.resumeMimeType = undefined;
      candidate.resumeSize = undefined;
      await candidate.save();
    }

    return candidate;
  },
};
