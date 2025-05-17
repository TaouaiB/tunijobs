const path = require('path');
const fs = require('fs-extra');
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
      const candidate = await Candidate.findOne({ userId });
      if (!candidate) {
        throw new ApiError(`Candidate profile for user ${userId} not found`, 404);
      }
  
      // Delete previous resume if exists
      if (candidate.resumeUrl) {
        const oldPath = path.join(
          process.cwd(),
          candidate.resumeUrl.replace(/^\/+/, '')
        );
        await cleanupFiles([oldPath]);
      }
  
      // Update candidate document
      candidate.resumeUrl = documentInfo.url;
      candidate.resumeOriginalName = documentInfo.originalName;
      candidate.resumeMimeType = documentInfo.mimetype;
      candidate.resumeSize = documentInfo.size;
      candidate.updatedAt = new Date();
  
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
    }
  };