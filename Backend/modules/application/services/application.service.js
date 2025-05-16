const mongoose = require('mongoose');
const pickFields = require('../../../core/utils/pickFields');
const ApiError = require('../../../core/utils/ApiError');

const Application = require('../models/applicationModel');
const Job = require('../../job/models/jobModel');
const Candidate = require('../../candidate/models/candidateModel');

const cleanupFiles = require('../../../core/utils/cleanupFiles');
const path = require('path');

/**
 * @namespace ApplicationService
 * @description Business logic for job applications
 */
class ApplicationService {
  /**
   * Upload and store a document in the application
   * @param {string} applicationId
   * @param {Object} documentInfo - { path, url, originalName, mimetype, size }
   * @returns {Promise<Object>} Updated application document
   * @throws {ApiError} If application not found
   */
  static async storeDocument(id, uploadedFiles) {
    const application = await Application.findById(id);

    if (!application) {
      throw new ApiError(`Application with ID ${id} not found`, 404);
    }

    // Validate we have files to process
    if (
      !uploadedFiles ||
      (!uploadedFiles.resume &&
        !uploadedFiles.coverLetter &&
        !uploadedFiles.documents?.length)
    ) {
      throw new ApiError('No valid files to store', 400);
    }

    // Handle resume upload
    if (uploadedFiles.resume) {
      if (!uploadedFiles.resume.url || !uploadedFiles.resume.name) {
        throw new ApiError('Resume file is missing required fields', 400);
      }
      application.resumeUrl = uploadedFiles.resume.url;
    }

    // Handle cover letter upload
    if (uploadedFiles.coverLetter) {
      if (!uploadedFiles.coverLetter.url || !uploadedFiles.coverLetter.name) {
        throw new ApiError('Cover letter is missing required fields', 400);
      }
      application.coverLetter = uploadedFiles.coverLetter.url;
    }

    // Handle additional documents
    if (uploadedFiles.documents?.length > 0) {
      for (const doc of uploadedFiles.documents) {
        if (!doc.name || !doc.url || !doc.type || !doc.size) {
          console.error('Invalid document format:', doc);
          continue; // Skip invalid documents or throw error if you prefer
        }

        application.documents.push({
          name: doc.name,
          url: doc.url,
          type: doc.type,
          size: doc.size,
          uploadedAt: new Date(),
        });
      }
    }

    await application.save();
    return application;
  }

  /**
   * Remove a document from the application and delete file from disk
   * @param {string} applicationId
   * @param {string} documentUrl - Relative path of the document to remove
   * @returns {Promise<Object>} Updated application document
   * @throws {ApiError} If document or application not found
   */
  static async removeAllDocumentsAndCoverLetter(id) {
    const application = await Application.findById(id);
    if (!application) {
      throw new ApiError(`Application with ID ${id} not found`, 404);
    }

    const filesToDelete = [];

    if (application.coverLetter) {
      console.log('Deleting cover letter:', application.coverLetter);
      const coverLetterPath = path.join(
        process.cwd(),
        application.coverLetter.replace(/^\/+/, '')
      );
      filesToDelete.push(coverLetterPath);
      application.coverLetter = undefined;
    }

    if (application.documents && application.documents.length) {
      application.documents.forEach((doc) => {
        console.log('Deleting document:', doc.url);
        const docPath = path.join(process.cwd(), doc.url.replace(/^\/+/, ''));
        filesToDelete.push(docPath);
      });
      application.documents = [];
    }

    console.log('Files to delete:', filesToDelete);

    await cleanupFiles(filesToDelete);

    await application.save();

    return application;
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
