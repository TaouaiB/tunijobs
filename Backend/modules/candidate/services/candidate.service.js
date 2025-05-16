const path = require('path');

const ApiError = require('../../../core/utils/ApiError');
const pickFields = require('../../../core/utils/pickFields');
const Candidate = require('../models/candidateModel');
const User = require('../../user/models/userModel');
const cleanupFiles = require('../../../core/utils/cleanupFiles');

/**
 * Service layer for candidate profile operations
 * @class CandidateService
 */
class CandidateService {
  /**
   * Create a candidate profile
   * @async
   * @param {string} userId - Associated user ID
   * @param {Object} candidateData - Candidate profile data
   * @returns {Promise<Object>} Created candidate document
   * @throws {ApiError} If user not found (404) or profile exists (409)
   */
  static async createCandidate(userId, candidateData) {
    const [userExists, candidateExists] = await Promise.all([
      User.exists({ _id: userId }),
      Candidate.exists({ userId }),
    ]);

    if (!userExists) throw new ApiError(`User ${userId} not found`, 404);
    if (candidateExists)
      throw new ApiError('Candidate profile already exists', 409);

    return await Candidate.create({
      ...pickFields(candidateData, 'candidate', true),
      userId,
    }).then((doc) => doc.populate('userId', 'name email'));
  }

  /**
   * Store resume URL for a candidate (like avatar storage for images)
   * @param {string} userId
   * @param {Object} documentInfo - { path, url, originalName, mimetype, size }
   * @returns {Promise<Object>} Updated candidate document
   * @throws {ApiError} If candidate not found
   */
  static async storeResume(userId, documentInfo) {
    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(`Candidate profile for user ${userId} not found`, 404);
    }

    // Delete previous resume file from local storage
    if (candidate.resumeUrl) {
      const oldPath = path.join(
        process.cwd(),
        candidate.resumeUrl.replace(/^\/+/, '')
      );
      await cleanupFiles([oldPath]);
    }

    // Save new resume info
    candidate.resumeUrl = documentInfo.url;
    candidate.resumeOriginalName = documentInfo.originalName;
    candidate.resumeMimeType = documentInfo.mimetype;
    candidate.resumeSize = documentInfo.size;
    candidate.updatedAt = new Date();

    await candidate.save();

    return candidate;
  }

  /**
   * Remove resume file from disk and clear resumeUrl in DB
   * @param {string} userId - User ID linked to the candidate
   * @returns {Promise<Object>} Updated candidate document
   * @throws {ApiError} If candidate not found
   */
  static async removeResume(userId) {
    const candidate = await Candidate.findOne({ userId });

    if (!candidate) {
      throw new ApiError(`Candidate profile for user ${userId} not found`, 404);
    }

    if (candidate.resumeUrl) {
      const absolutePath = path.join(process.cwd(), candidate.resumeUrl);

      // Delete resume file using your utility
      await cleanupFiles([absolutePath]);

      // Clear the resumeUrl field
      candidate.resumeUrl = undefined;
      await candidate.save();
    }

    return candidate;
  }

  /**
   * Get all candidate profiles with optional filtering
   * @async
   * @param {Object} [filters={}] - MongoDB filter criteria
   * @param {Object} [options={}] - Query options (sort, pagination)
   * @returns {Promise<Array>} Array of candidate documents
   */
  static async getAllCandidates(filters = {}, options = {}) {
    return await Candidate.find(filters)
      .populate({
        path: 'userId',
        select: 'name email status',
        match: { status: 'active' },
      })
      .select('-__v -createdAt')
      .sort(options.sort || '-createdAt');
  }

  /**
   * Get candidate by user ID
   * @async
   * @param {string} userId - Associated user ID
   * @returns {Promise<Object>} Candidate document
   * @throws {ApiError} If not found (404)
   */
  static async getByUserId(userId) {
    const candidate = await Candidate.findOne({ userId })
      .populate('userId', 'name email role')
      .select('-__v');

    if (!candidate)
      throw new ApiError(`Candidate not found for user ${userId}`, 404);
    return candidate;
  }

  /**
   * Update candidate profile
   * @async
   * @param {string} userId - Associated user ID
   * @param {Object} updateData - Update payload
   * @returns {Promise<Object>} Updated candidate document
   * @throws {ApiError} If not found (404)
   */
  static async updateByUserId(userId, updateData) {
    const candidate = await Candidate.findOneAndUpdate(
      { userId },
      pickFields(updateData, 'candidate', true),
      {
        new: true,
        runValidators: true,
      }
    ).populate('userId', 'name email');

    if (!candidate)
      throw new ApiError(`Candidate not found for user ${userId}`, 404);
    return candidate;
  }

  /**
   * Delete candidate by ID
   * @async
   * @param {string} candidateId - Candidate document ID
   * @returns {Promise<Object>} Deleted document
   * @throws {ApiError} If not found (404)
   */
  static async deleteById(candidateId) {
    const candidate = await Candidate.findByIdAndDelete(candidateId);
    console.log(candidateId);
    if (!candidate) throw new ApiError('Candidate not found', 404);
    return candidate;
  }

  /**
   * Delete candidate by user ID
   * @async
   * @param {string} userId - Associated user ID
   * @returns {Promise<Object>} Deleted document
   * @throws {ApiError} If not found (404)
   */
  static async deleteByUserId(userId) {
    const candidate = await Candidate.findOneAndDelete({ userId });
    if (!candidate)
      throw new ApiError(`Candidate not found for user ${userId}`, 404);
    return candidate;
  }
}

module.exports = CandidateService;
