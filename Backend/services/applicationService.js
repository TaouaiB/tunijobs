// applicationService.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const pickFields = require('../utils/pickFields');

const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const Candidate = require('../models/candidateModel');
const Company = require('../models/companyModel');

// Mocked AI & Utility Services (to be replaced later)
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

const NotificationService = {
  send: (userId, message) =>
    console.log(`🔔 Notification to ${userId}: ${message}`),
};

const AnalyticsService = {
  track: (event, data) =>
    console.log(`📊 [Analytics] ${event}:`, JSON.stringify(data, null, 2)),
};

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

// @desc    Submit a new application for a job
// @route   POST /api/v1/jobs/:jobId/apply
// @access  Candidate
exports.submitApplication = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const filteredBody = pickFields(req.body, 'application', true);
  const { candidateId, coverLetter } = filteredBody;

  // Validate job existence and status
  const job = await Job.findById(jobId);
  if (!job?.isActive) {
    throw new ApiError('Job not available or inactive', 404);
  }

  // Validate candidate existence
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError('Candidate profile not found', 400);
  }

  // AI analysis of cover letter
  const aiAnalysis =
    coverLetter ? AIService.analyzeCoverLetter(coverLetter) : null;

  // Calculate application score
  const applicationScore = calculateApplicationScore({
    resumeUrl: candidate.resumeUrl,
    coverLetterLength: coverLetter?.length,
  });

  // Create application
  const application = await Application.create({
    jobId,
    candidateId: candidate._id,
    companyId: job.companyId,
    ...filteredBody,
    score: applicationScore,
    metadata: {
      aiAnalysis,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
    statusHistory: [
      {
        status: 'submitted',
        changedBy: candidateId,
        notes: `Application submitted${aiAnalysis ? ` | AI Score: ${aiAnalysis.score}` : ''}`,
      },
    ],
  });

  // Notify company
  NotificationService.send(
    job.companyId,
    `New application received for ${job.title}`
  );

  // Track analytics
  AnalyticsService.track('application_submitted', {
    applicationId: application._id,
    jobId,
    candidateId: candidate._id,
    aiScore: aiAnalysis?.score,
  });

  // Respond with application data
  res.status(201).json({
    status: 'success',
    data: {
      application,
      insights: {
        score: applicationScore,
        ...(aiAnalysis && {
          aiFeedback: {
            strength: aiAnalysis.score > 70 ? 'strong' : 'average',
            keywords: aiAnalysis.keywords,
          },
        }),
      },
      nextSteps: [
        candidate.resumeUrl ? null : 'Upload your resume',
        'Complete your profile',
      ].filter(Boolean),
    },
  });
});

// @desc    Update the application status
// @route   PUT /api/v1/applications/:id/status
// @access  Employer/Admin
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, userId, notes } = pickFields(req.body, 'application', true);

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
  AnalyticsService.track('status_updated', {
    applicationId: application._id,
    from: previousStatus,
    to: status,
  });

  res.json({
    status: 'success',
    data: { application, nextSteps: aiSuggestions },
  });
});

// @desc    Withdraw an application
// @route   PUT /api/v1/applications/:id/withdraw
// @access  Candidate
exports.withdrawApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, reason } = req.body;

  const application = await Application.findById(id);
  if (!application) throw new ApiError('Application not found', 404);

  if (!application.candidateId.equals(userId)) {
    throw new ApiError(
      'You are not authorized to withdraw this application',
      403
    );
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
    `Candidate withdrew application for job ${application.jobId}`
  );

  res.json({
    status: 'success',
    message: 'Application withdrawn',
    application,
  });
});

// @desc    Get application by ID
// @route   GET /api/v1/applications/:id
// @access  Authenticated
exports.getApplicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

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

  res.json({ status: 'success', data: { application } });
});

// @desc    Get all applications for a candidate
// @route   GET /api/v1/applications/candidate/:candidateId
// @access  Candidate
exports.getApplicationsByCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const applications = await Application.find({ candidateId }).populate(
    'jobId'
  );
  res.json({
    status: 'success',
    results: applications.length,
    data: applications,
  });
});

// @desc    Get all applications for a job
// @route   GET /api/v1/applications/job/:jobId
// @access  Employer/Admin
exports.getApplicationsByJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const applications = await Application.find({ jobId }).populate(
    'candidateId'
  );
  res.json({
    status: 'success',
    results: applications.length,
    data: applications,
  });
});

// @desc    Get filtered applications for dashboard
// @route   GET /api/v1/applications/dashboard
// @access  Employer/Admin
exports.getApplicationDashboard = asyncHandler(async (req, res) => {
  const { companyId } = req.user;
  const { status, minScore, page = 1, limit = 20 } = req.query;

  const filter = { companyId };
  if (status) filter.status = status;
  if (minScore) filter.score = { $gte: Number(minScore) };

  const applications = await Application.find(filter)
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
    .sort('-createdAt');

  const total = await Application.countDocuments(filter);

  res.json({
    status: 'success',
    data: {
      applications,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Delete application
// @route   DELETE /api/v1/applications/:id
// @access  Admin
exports.deleteApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const application = await Application.findByIdAndDelete(id);
  if (!application) throw new ApiError('Application not found', 404);
  res.json({ status: 'success', message: 'Application deleted' });
});

// @desc    Schedule interview for an application
// @route   POST /api/v1/applications/:id/schedule
// @access  Employer
exports.scheduleInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { interviewer, date, type } = req.body;

  const application = await Application.findById(id);
  if (!application) throw new ApiError('Application not found', 404);

  const interview = {
    type,
    interviewer,
    scheduledAt: new Date(date),
    template: getInterviewTemplate(type),
  };

  application.interviews.push(interview);
  await application.save();

  NotificationService.send(
    application.candidateId,
    `You have an interview scheduled on ${date}`
  );
  res.json({ status: 'success', data: { interview } });
});

// @desc    Recalculate and update application score
// @route   PUT /api/v1/applications/:id/score
// @access  Admin
exports.recalculateScore = asyncHandler(async (req, res) => {
  const { id } = req.params;

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

  res.json({ status: 'success', data: { score } });
});

module.exports = exports;
