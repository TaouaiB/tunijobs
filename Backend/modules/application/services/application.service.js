const mongoose = require('mongoose');
const pickFields = require('../../../core/utils/pickFields');
const ApiError = require('../../../core/utils/ApiError');

const Application = require('../models/applicationModel');
const Job = require('../../job/models/jobModel');
const Candidate = require('../../candidate/models/candidateModel');
const documentStorage = require('./documents/storage.service');

const path = require('path');

/**
 * @namespace ApplicationService
 * @description Business logic for job applications
 */
class ApplicationService {
  static async storeDocument(applicationId, files) {
    try {
      const updatedApp = await documentStorage.storeDocuments(
        applicationId,
        files
      );

      return updatedApp;
    } catch (error) {
      if (error.code === 'FILE_UPLOAD_FAILED') {
        throw new ApiError('Document storage failed: ' + error.message, 502);
      }
      throw error;
    }
  }

  /**
   * Remove all documents from an application
   * @param {string} applicationId
   * @returns {Promise<Object>} Updated application
   */
  static async removeAllDocuments(applicationId) {
    return documentStorage.removeAllDocuments(applicationId);
  }

  /**
   * Submit a new job application
   * @param {string} jobId - The job ID to apply for
   * @param {Object} applicationData - Application data
   * @param {string} ipAddress - Applicant's IP address
   * @param {string} userAgent - Applicant's user agent
   * @returns {Promise<Object>} Created application with insights
   */
  static async submitApplication(jobId, applicationData, ipAddress, userAgent) {
    const filteredBody = pickFields(applicationData, 'application', true);
    const { candidateId, coverLetter } = filteredBody;

    const [job, candidate] = await Promise.all([
      Job.findById(jobId),
      Candidate.findById(candidateId),
    ]);

    if (!job?.isActive) throw new ApiError('Job not available', 404);
    if (!candidate) throw new ApiError('Candidate not found', 400);

    const score = this.calculateApplicationScore({
      resumeUrl: candidate.resumeUrl,
      coverLetterLength: coverLetter?.length,
    });

    const application = await Application.create({
      jobId,
      candidateId: candidate._id,
      companyId: job.companyId,
      ...filteredBody,
      score,
      metadata: {
        ipAddress,
        userAgent,
      },
      statusHistory: [
        {
          status: 'submitted',
          changedBy: candidateId,
        },
      ],
    });

    return {
      status: 'success',
      data: {
        application,
        nextSteps: [
          !candidate.resumeUrl && 'Upload your resume',
          'Complete your profile',
        ].filter(Boolean),
      },
    };
  }

  /**
   * Update application status
   * @param {string} id - Application ID
   * @param {Object} updateData - Update data (status, userId, notes)
   * @returns {Promise<Object>} Updated application with suggestions
   */
  async updateStatus(id, updateData) {
    const { status, userId, notes } = pickFields(
      updateData,
      'application',
      true
    );
    const application = await Application.findById(id);
    if (!application) throw new ApiError('Application not found', 404);

    const previousStatus = application.status;

    application.status = status;
    application.statusHistory.push({
      status,
      changedBy: userId,
      notes: notes || `Status updated to ${status}`,
      metadata: {
        confirmed: !['rejected', 'withdrawn'].includes(status),
      },
    });

    await application.save();

    return {
      status: 'success',
      data: { application },
    };
  }

  /**
   * Withdraw an application
   * @param {string} id - Application ID
   * @param {Object} withdrawData - Withdrawal data (userId, reason)
   * @returns {Promise<Object>} Withdrawal confirmation
   */
  async withdrawApplication(id, withdrawData) {
    const { userId, reason } = withdrawData;
    const application = await Application.findById(id).populate({
      path: 'candidateId',
      select: 'userId',
    });

    if (!application) throw new ApiError('Application not found', 404);
    if (application.candidateId.userId.toString() !== userId.toString()) {
      throw new ApiError('Unauthorized', 403);
    }

    application.status = 'withdrawn';
    application.statusHistory.push({
      status: 'withdrawn',
      changedBy: userId,
      notes: reason || 'Withdrawn by candidate',
    });

    await application.save();

    NotificationService.send(
      application.companyId,
      `Application withdrawn for job ${application.jobId}`
    );

    return {
      status: 'success',
      message: 'Application withdrawn',
      data: {
        applicationId: application._id,
        jobId: application.jobId,
        newStatus: application.status,
      },
    };
  }

  /**
   * Get application by ID
   * @param {string} id - Application ID
   * @returns {Promise<Object>} Application details
   */
  async getApplicationById(id) {
    const application = await Application.findById(id)
      .populate({
        path: 'jobId',
        select: 'title description',
      })
      .populate({
        path: 'candidateId',
        select: 'headline resumeUrl',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      });

    if (!application) throw new ApiError('Application not found', 404);
    return { status: 'success', data: { application } };
  }

  /**
   * Get applications by candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object>} List of applications
   */
  async getApplicationsByCandidate(candidateId) {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) throw new ApiError('Candidate not found', 404);

    const applications = await Application.find({ candidateId }).populate(
      'jobId'
    );
    return {
      status: 'success',
      results: applications.length,
      data: applications,
    };
  }

  /**
   * Get applications by job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} List of applications
   */
  async getApplicationsByJob(jobId) {
    const applications = await Application.find({ jobId }).populate(
      'candidateId'
    );
    return {
      status: 'success',
      results: applications.length,
      data: applications,
    };
  }

  /**
   * Get applications dashboard
   * @param {Object} query - Filter query parameters
   * @returns {Promise<Object>} Paginated applications with stats
   */
  async getApplicationDashboard(query) {
    const { companyId, status, minScore, page = 1, limit = 20 } = query;
    if (!companyId) throw new ApiError('Company ID required', 400);

    const filter = { companyId };
    if (status) filter.status = status;
    if (minScore) filter.score = { $gte: Number(minScore) };

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate({
          path: 'jobId',
          select: 'title',
        })
        .populate({
          path: 'candidateId',
          select: 'headline',
          populate: {
            path: 'userId',
            select: 'name avatar',
          },
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort('-createdAt'),
      Application.countDocuments(filter),
    ]);

    return {
      status: 'success',
      data: {
        applications,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Delete an application
   * @param {string} id - Application ID
   * @returns {Promise<void>}
   */
  async deleteApplication(id) {
    const application = await Application.findByIdAndDelete(id);
    if (!application) throw new ApiError('Application not found', 404);
  }

  /**
   * Schedule an interview
   * @param {string} id - Application ID
   * @param {Object} interviewData - Interview details
   * @returns {Promise<Object>} Scheduled interview details
   */
  async scheduleInterview(id, interviewData) {
    const { scheduledAt, interviewType, location, attendees } = interviewData;

    if (!interviewType || !scheduledAt) {
      throw new ApiError('Type and date are required', 400);
    }
    if (!attendees?.length) {
      throw new ApiError('At least one attendee required', 400);
    }

    const application = await Application.findById(id);
    if (!application) throw new ApiError('Application not found', 404);

    const interview = {
      interviewType,
      scheduledAt: new Date(scheduledAt),
      template: this.getInterviewTemplate(interviewType),
      result: 'pending',
      location: location || 'To be determined',
      attendees: attendees.map((attendee) => ({
        userId: attendee.userId,
        role: attendee.role || 'Interviewer',
      })),
    };

    application.interviews.push(interview);
    await application.save();

    NotificationService.send(
      application.candidateId,
      `${interviewType} interview scheduled for ${new Date(scheduledAt).toLocaleString()}`
    );

    return { status: 'success', data: { interview } };
  }

  /**
   * Recalculate application score
   * @param {string} id - Application ID
   * @returns {Promise<Object>} Updated score
   */
  async recalculateScore(id) {
    const application = await Application.findById(id).populate('candidateId');
    if (!application) throw new ApiError('Application not found', 404);

    const score = this.calculateApplicationScore({
      resumeUrl: application.candidateId?.resumeUrl,
      coverLetterLength: application.coverLetter?.length,
      status: application.status,
      interviewsCount: application.interviews?.length || 0,
    });

    application.score = score;
    await application.save();

    return { status: 'success', data: { score } };
  }

  /**
   * Calculate application score (0-100)
   * @private
   * @param {Object} factors - Scoring factors
   * @returns {number} Calculated score
   */
  calculateApplicationScore({
    resumeUrl,
    coverLetterLength = 0,
    status,
    interviewsCount = 0,
  }) {
    let score = 50;
    if (resumeUrl) score += 10;
    if (coverLetterLength > 200) score += 15;
    if (status === 'shortlisted') score += 20;
    score += interviewsCount * 5;
    return Math.min(score, 100);
  }

  /**
   * Get interview template by type
   * @private
   * @param {string} type - Interview type
   * @returns {string} Template description
   */
  getInterviewTemplate(type) {
    const templates = {
      phone: 'Standard phone screening questions',
      video: 'Video conference link will be shared',
      onsite: 'Bring your ID and portfolio',
      technical_test: 'Coding challenge will be provided',
    };
    return templates[type] || 'General interview questions';
  }
}

module.exports = ApplicationService;
