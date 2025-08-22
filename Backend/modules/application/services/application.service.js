const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');
const pickFields = require('../../../core/utils/pickFields');
const ApiError = require('../../../core/utils/ApiError');
const Application = require('../models/applicationModel');
const Job = require('../../job/models/jobModel');
const Candidate = require('../../candidate/models/candidateModel');
const documentStorage = require('./documents/storage.service');

// Mock services (replace with actual implementations)
const NotificationService = {
  send: (userId, message) =>
    console.log(`Notification to ${userId}: ${message}`),
};

const AIService = {
  analyzeCoverLetter: (text) => ({
    score: Math.min(100, Math.floor(text.length / 5)),
    keywords: [...new Set(text.match(/\b(\w{4,})\b/g))].slice(0, 5),
    sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
  }),
  suggestStatusChange: (currentStatus) => {
    const suggestions = {
      submitted: ['under_review', 'rejected'],
      under_review: ['shortlisted', 'additional_screening'],
      shortlisted: ['interviewing'],
    };
    return suggestions[currentStatus] || [];
  },
};

// Utility functions
const calculateApplicationScore = ({
  resumeUrl,
  coverLetterLength = 0,
  status,
  interviewsCount = 0,
}) => {
  let score = 50;
  if (resumeUrl) score += 10;
  if (coverLetterLength > 200) score += 15;
  if (status === 'shortlisted') score += 20;
  score += interviewsCount * 5;
  return Math.min(score, 100);
};

const getInterviewTemplate = (type) => {
  const templates = {
    phone: 'Standard phone screening questions',
    video: 'Video conference link will be shared',
    onsite: 'Bring your ID and portfolio',
    technical_test: 'Coding challenge will be provided',
  };
  return templates[type] || 'General interview questions';
};

/**
 * @desc    Store documents for an application
 * @param   {string} applicationId - Application ID
 * @param   {Object} files - Uploaded files
 * @return  {Promise<Object>} Updated application
 * @memberof ApplicationService
 */
const { parseApplicationDocument } = require('./resumeService'); // your parser service

exports.storeDocument = async (applicationId, files) => {
  try {
    // 1️⃣ Store documents
    const application = await documentStorage.storeDocuments(
      applicationId,
      files
    );

    // 2️⃣ Automatically parse the latest uploaded document
    // Assume files is an array of uploaded file info
    const latestDoc = files[files.length - 1]; // last uploaded
    if (latestDoc && latestDoc._id) {
      try {
        const parsedData = await parseApplicationDocument(
          applicationId,
          latestDoc._id
        );

        // Add metadata about the parsing
        parsedData.parsedAt = new Date();
        // You might want to add parser version information

        // Update application with parsed data
        application.metadata = application.metadata || {};
        application.metadata.parsedResume = parsedData;

        // Also add reference to the document that was parsed
        const docIndex = application.documents.findIndex(
          (doc) => doc._id.toString() === latestDoc._id.toString()
        );
        if (docIndex !== -1) {
          application.documents[docIndex].parsedDataRef = application._id;
        }

        await application.save();
      } catch (parseError) {
        // Log parsing error but don't fail the entire document storage
        console.error('Failed to parse document:', parseError);
        // You might want to set a flag indicating parsing failed
        application.metadata = application.metadata || {};
        application.metadata.parsedResume = {
          parseError: true,
          errorMessage: parseError.message,
          attemptedAt: new Date(),
        };
        await application.save();
      }
    }

    return application;
  } catch (error) {
    if (error.code === 'FILE_UPLOAD_FAILED') {
      throw new ApiError('Document storage failed: ' + error.message, 502);
    }
    throw error;
  }
};

/**
 * @desc    Remove all documents from an application
 * @param   {string} applicationId - Application ID
 * @return  {Promise<Object>} Updated application
 * @memberof ApplicationService
 */
exports.removeAllDocuments = async (applicationId) => {
  return documentStorage.removeAllDocuments(applicationId);
};

/**
 * @desc    Submit a new job application
 * @param   {string} jobId - Job ID to apply for
 * @param   {Object} applicationData - Application data
 * @param   {string} ipAddress - Applicant's IP address
 * @param   {string} userAgent - Applicant's user agent
 * @return  {Promise<Object>} Created application with insights
 * @memberof ApplicationService
 */
exports.submitApplication = async (
  jobId,
  applicationData,
  ipAddress,
  userAgent,
  uploadedFiles
) => {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError('Invalid job ID format', 400);
  }
  console.log('Passed jobId validation');

  const filteredBody = pickFields(applicationData, 'application', true);
  const candidateId = applicationData.candidateId;
  const coverLetter = filteredBody.coverLetter;

  // Check for existing application
  const existingApplication = await Application.findOne({
    jobId,
    candidateId,
    deletedAt: { $exists: true }, // Explicitly check for soft-deleted docs
  }).exec();

  console.log('Found application:', {
    exists: !!existingApplication,
    deletedAt: existingApplication?.deletedAt,
    id: existingApplication?._id,
    jobId,
    candidateId,
  });

  if (existingApplication) {
    if (existingApplication.deletedAt) {
      // Candidate withdrew before, allow reapply by "reactivating" app
      existingApplication.deletedAt = null; // clear soft delete
      existingApplication.status = 'submitted';
      existingApplication.statusHistory.push({
        status: 'submitted',
        changedBy: candidateId,
        notes: 'Re-applied after withdrawal',
        changedAt: new Date(),
      });
      // Update cover letter and metadata
      existingApplication.coverLetter =
        coverLetter ?
          sanitizeHtml(coverLetter, { allowedTags: [], allowedAttributes: {} })
        : '';
      existingApplication.metadata = {
        ...existingApplication.metadata,
        aiAnalysis:
          coverLetter ? AIService.analyzeCoverLetter(coverLetter) : null,
        ipAddress,
        userAgent,
      };
      existingApplication.score = calculateApplicationScore({
        resumeUrl: existingApplication.candidateId.resumeUrl,
        coverLetterLength: existingApplication.coverLetter.length,
      });

      await existingApplication.save();

      if (uploadedFiles && Object.keys(uploadedFiles).length > 0) {
        await exports.storeDocument(existingApplication._id, uploadedFiles);
      }

      NotificationService.send(
        existingApplication.companyId,
        `Re-application received for ${existingApplication.jobId}`
      );

      return {
        status: 'success',
        data: {
          application: existingApplication,
          message: 'Re-applied successfully',
        },
      };
    } else {
      // Application already active
      throw new ApiError('You have already applied to this job', 409);
    }
  }

  // No existing application found, proceed normally to create a new one

  const [job, candidate] = await Promise.all([
    Job.findById(jobId),
    Candidate.findById(candidateId).populate('userId'),
  ]);

  if (!job?.isActive) throw new ApiError('Job not found or inactive', 404);
  if (!candidate) throw new ApiError('Candidate not found', 400);

  // Sanitize and analyze cover letter
  const sanitizedCoverLetter =
    coverLetter ?
      sanitizeHtml(coverLetter, {
        allowedTags: [],
        allowedAttributes: {},
      })
    : '';

  const aiAnalysis =
    coverLetter ? AIService.analyzeCoverLetter(coverLetter) : null;

  // Calculate score
  const score = calculateApplicationScore({
    resumeUrl: candidate.resumeUrl,
    coverLetterLength: sanitizedCoverLetter?.length,
  });

  // Create application
  const application = await Application.create({
    jobId,
    candidateId: candidate._id,
    companyId: job.companyId,
    ...filteredBody,
    coverLetter: sanitizedCoverLetter,
    score,
    metadata: {
      aiAnalysis,
      ipAddress,
      userAgent,
    },
    statusHistory: [
      {
        status: 'submitted',
        changedBy: candidateId,
        notes: `Application submitted${aiAnalysis ? ` | AI Score: ${aiAnalysis.score}` : ''}`,
      },
    ],
  });

  // ✅ Save uploaded PDFs after creation
  if (uploadedFiles && Object.keys(uploadedFiles).length > 0) {
    console.log('Files received in submitApplication:', uploadedFiles); // Log files input

    await exports.storeDocument(application._id, uploadedFiles);

    console.log('Documents stored successfully');
  } else {
    console.log('No files to store');
  }

  NotificationService.send(
    job.companyId,
    `New application received for ${job.title}`
  );

  return {
    status: 'success',
    data: {
      application,
      insights: {
        score,
        ...(aiAnalysis && {
          aiFeedback: {
            strength: aiAnalysis.score > 70 ? 'strong' : 'average',
            keywords: aiAnalysis.keywords,
          },
        }),
      },
      nextSteps: [
        !candidate.resumeUrl && 'Upload your resume',
        'Complete your profile',
      ].filter(Boolean),
    },
  };
};

/**
 * @desc    Update application status
 * @param   {string} id - Application ID
 * @param   {Object} updateData - Update data (status, userId, notes)
 * @return  {Promise<Object>} Updated application with suggestions
 * @memberof ApplicationService
 */
exports.updateApplicationStatus = async (id, updateData) => {
  const { status, userId, notes } = pickFields(updateData, 'application', true);

  const application = await Application.findById(id);
  if (!application) throw new ApiError('Application not found', 404);

  const previousStatus = application.status;
  const aiSuggestions = AIService.suggestStatusChange(previousStatus);

  application.status = status;
  application.statusHistory.push({
    status,
    changedBy: userId,
    notes: notes || `Status updated to ${status}`,
    metadata: {
      aiSuggestions,
      confirmed: !['rejected', 'withdrawn'].includes(status),
    },
  });

  await application.save();

  NotificationService.send(
    application.candidateId,
    `Your application status changed to ${status}`
  );

  return {
    status: 'success',
    data: {
      application,
      nextSteps: aiSuggestions,
    },
  };
};
/**
 * @desc    Withdraw an application
 * @param   {string} id - Application ID
 * @param   {Object} withdrawData - Withdrawal data (userId, reason)
 * @return  {Promise<Object>} Withdrawal confirmation
 * @memberof ApplicationService
 */
exports.withdrawApplication = async (id, candidateId, withdrawData) => {
  const reason = withdrawData.reason || 'Withdrawn by candidate';

  const application = await Application.findById(id);

  if (application.candidateId.toString() !== candidateId.toString()) {
    console.log(
      `Candidate ${candidateId} attempted to withdraw application ${id} without permission`
    );
    throw new ApiError('Unauthorized', 403);
  }

  application.status = 'withdrawn';
  application.deletedAt = new Date();
  application.version = (application.version || 0) + 1;

  application.statusHistory.push({
    status: 'withdrawn',
    changedBy: candidateId,
    notes: reason,
  });

  await application.save();

  NotificationService.send(
    application.companyId,
    `Application withdrawn for job ${application.jobId}`
  );

  return {
    status: 'success',
    message: 'Application withdrawn successfully',
    data: {
      applicationId: application._id,
      jobId: application.jobId,
      newStatus: application.status,
    },
  };
};

/**
 * @desc    Get application by ID
 * @param   {string} id - Application ID
 * @return  {Promise<Object>} Application details
 * @memberof ApplicationService
 */
exports.getApplicationById = async (id) => {
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

  return {
    status: 'success',
    data: { application },
  };
};

/**
 * @desc    Get applications by candidate ID
 * @param   {string} candidateId - Candidate ID
 * @param   {Object} [options] - Optional parameters
 * @param   {string} [options.status] - Filter by status
 * @param   {number} [options.page=1] - Page number
 * @param   {number} [options.limit=10] - Items per page
 * @return  {Promise<Object>} Paginated applications
 * @memberof ApplicationService
 */
exports.getApplicationsByCandidate = async (
  candidateId,
  { status, page = 1, limit = 10 } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(candidateId)) {
    throw new ApiError('Invalid candidate ID format', 400);
  }

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) throw new ApiError('Candidate not found', 404);

  const filter = { candidateId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate({
        path: 'jobId',
        select: 'title companyId',
        populate: {
          path: 'companyId',
          select: 'name logo',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'),
    Application.countDocuments(filter),
  ]);

  return {
    status: 'success',
    results: applications.length,
    data: applications,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

/**
 * @desc    Get applications by job ID
 * @param   {string} jobId - Job ID
 * @param   {Object} [options] - Optional parameters
 * @param   {string} [options.status] - Filter by status
 * @param   {number} [options.minScore] - Minimum application score
 * @param   {number} [options.page=1] - Page number
 * @param   {number} [options.limit=10] - Items per page
 * @return  {Promise<Object>} Paginated applications
 * @memberof ApplicationService
 */
exports.getApplicationsByJob = async (
  jobId,
  { status, minScore, page = 1, limit = 10 } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new ApiError('Invalid job ID format', 400);
  }

  const job = await Job.findById(jobId);
  if (!job) throw new ApiError('Job not found', 404);

  const filter = { jobId };
  if (status) filter.status = status;
  if (minScore) filter.score = { $gte: Number(minScore) };

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate({
        path: 'candidateId',
        select: 'headline resumeUrl',
        populate: {
          path: 'userId',
          select: 'name email',
        },
      })
      .skip(skip)
      .limit(limit)
      .sort('-score'),
    Application.countDocuments(filter),
  ]);

  return {
    status: 'success',
    results: applications.length,
    data: applications,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

/**
 * @desc    Get all applications for a specific company
 * @param   {string} companyId - Company ID
 * @param   {Object} filters - Optional filters (status, jobId, search)
 * @return  {Promise<Object>} List of applications with candidate & job info
 * @memberof ApplicationService
 */
exports.getApplicationsByCompany = async (companyId, filters = {}) => {
  const query = { companyId };

  if (filters.status) query.status = filters.status;
  if (filters.jobId) query.jobId = filters.jobId;
  if (filters.search) {
    query.$or = [{ coverLetter: { $regex: filters.search, $options: 'i' } }];
  }

  const applications = await Application.find(query)
    .populate({
      path: 'jobId',
      select: 'title location',
    })
    .populate({
      path: 'candidateId',
      select: 'headline resumeUrl',
      populate: {
        path: 'userId',
        select: 'name email',
      },
    })
    .sort({ createdAt: -1 });

  if (!applications.length) throw new ApiError('No applications found', 404);

  return {
    status: 'success',
    results: applications.length,
    data: { applications },
  };
};

/**
 * @desc    Get application dashboard for company
 * @param   {string} companyId - Company ID
 * @param   {Object} [options] - Optional parameters
 * @param   {string} [options.status] - Filter by status
 * @param   {number} [options.minScore] - Minimum application score
 * @param   {number} [options.page=1] - Page number
 * @param   {number} [options.limit=10] - Items per page
 * @return  {Promise<Object>} Paginated applications with stats
 * @memberof ApplicationService
 */
exports.getApplicationDashboard = async (
  companyId,
  { status, minScore, page = 1, limit = 10 } = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new ApiError('Invalid company ID format', 400);
  }

  const filter = { companyId };
  if (status) filter.status = status;
  if (minScore) filter.score = { $gte: Number(minScore) };

  const skip = (page - 1) * limit;

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
      .skip(skip)
      .limit(limit)
      .sort('-createdAt'),
    Application.countDocuments(filter),
  ]);

  // Calculate status distribution
  const statusStats = await Application.aggregate([
    { $match: { companyId: mongoose.Types.ObjectId(companyId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return {
    status: 'success',
    data: {
      applications,
      stats: {
        total,
        byStatus: statusStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    },
  };
};

/**
 * @desc    Delete an application
 * @param   {string} id - Application ID
 * @return  {Promise<void>}
 * @memberof ApplicationService
 */
exports.deleteApplication = async (id) => {
  const application = await Application.findByIdAndDelete(id);
  if (!application) throw new ApiError('Application not found', 404);
};

/**
 * @desc    Schedule interview for an application
 * @param   {string} id - Application ID
 * @param   {Object} interviewData - Interview details
 * @return  {Promise<Object>} Scheduled interview details
 * @memberof ApplicationService
 */
exports.scheduleInterview = async (applicationId, companyId, interviewData) => {
  const { scheduledAt, interviewType, location, result } = interviewData;

  if (!interviewType || !scheduledAt) {
    throw new ApiError('Interview type and date are required', 400);
  }

  // 1. Fetch application
  const application = await Application.findById(applicationId);
  if (!application) throw new ApiError('Application not found', 404);

  // 2. Security check: ensure interviewer’s company matches application
  if (String(application.companyId) !== String(companyId)) {
    throw new ApiError(
      'Not authorized to schedule interview for this application',
      403
    );
  }

  // Build attendees automatically
  const attendees = [
    {
      companyId,
      role: 'Interviewer',
    },
    {
      candidateId: application.candidateId,
      role: 'Candidate',
    },
  ];

  console.log('DEBUG: application:', application);
  console.log('DEBUG: companyId from token:', companyId);
  console.log('DEBUG: candidateId from application:', application.candidateId);
  console.log('DEBUG: attendees before validation:', attendees);

  const interview = {
    interviewType,
    scheduledAt: new Date(scheduledAt),
    template: getInterviewTemplate(interviewType),
    result: result || 'pending',
    location: location || 'To be determined',

    attendees: [
      { companyId, role: 'Interviewer' }, // interviewer company
      { candidateId: application.candidateId, role: 'Candidate' }, // actual candidate
    ],
  };

  application.interviews.push(interview);
  await application.save();

  NotificationService.send(
    application.candidateId,
    `You have a ${interviewType} interview scheduled on ${new Date(scheduledAt).toLocaleString()}`
  );

  return {
    status: 'success',
    data: { interview },
  };
};

/**
 * @desc    Update the result of a specific interview in an application
 * @param   {string} applicationId
 * @param   {string} interviewId
 * @param   {string} result - New result ("passed", "failed", "no-show", etc.)
 * @return  {Promise<Object>} Updated interview
 */
exports.updateInterviewResult = async (
  applicationId,
  interviewId,
  result,
  companyId
) => {
  // 1. Fetch application
  const application = await Application.findById(applicationId);
  if (!application) throw new ApiError('Application not found', 404);

  // 2. Security: ensure company owns this application
  if (String(application.companyId) !== String(companyId)) {
    throw new ApiError(
      'Not authorized to update interview for this application',
      403
    );
  }

  // 3. Find the interview
  const interview = application.interviews.id(interviewId);
  if (!interview) throw new ApiError('Interview not found', 404);

  // 4. Update result
  interview.result = result; // 'pass', 'fail', or 'pending'
  await application.save();

  return {
    status: 'success',
    data: { interview },
  };
};

/**
 * @desc    Recalculate application score
 * @param   {string} id - Application ID
 * @return  {Promise<Object>} Updated score
 * @memberof ApplicationService
 */
exports.recalculateScore = async (id) => {
  const application = await Application.findById(id).populate('candidateId');
  if (!application) throw new ApiError('Application not found', 404);

  const score = calculateApplicationScore({
    resumeUrl: application.candidateId?.resumeUrl,
    coverLetterLength: application.coverLetter?.length,
    status: application.status,
    interviewsCount: application.interviews?.length || 0,
  });

  application.score = score;
  await application.save();

  return {
    status: 'success',
    data: { score },
  };
};
