const { body, param, query } = require('express-validator');
const validatorMiddleware = require('../../../core/middlewares/validatorMiddleware');
const Application = require('../models/applicationModel');
const { get } = require('mongoose');
const {
  getApplicationsByCandidate,
} = require('../controllers/applicationController');

// Constants with enhanced metadata
const APPLICATION_METADATA = {
  STATUSES: {
    values: [
      'submitted',
      'under_review',
      'shortlisted',
      'interviewing',
      'offer_pending',
      'hired',
      'rejected',
      'withdrawn',
    ],
    description: 'Current state of the application workflow',
  },
  INTERVIEW_TYPES: {
    values: ['phone', 'video', 'onsite', 'technical_test'],
    description: 'Type of interview conducted',
  },
  INTERVIEW_RESULTS: {
    values: ['pass', 'fail', 'pending'],
    description: 'Result of an interview round',
  },
};

// Reusable validator components
const validateId = (field, entity) =>
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${entity} ID format (must be MongoDB ObjectId)`);

const validateApplicationId = validateId('id', 'Application');
const validateJobId = validateId('jobId', 'Job');
const validateCandidateId = validateId('candidateId', 'Candidate');

const createEnumValidator = (field, meta) =>
  body(field)
    .isIn(meta.values)
    .withMessage(
      `Invalid ${field}. Valid options: ${meta.values.join(', ')} (${meta.description})`
    );

// Field-specific validators
const validateCoverLetter = body('coverLetter')
  .optional()
  .trim()
  .isLength({ max: 5000 })
  .withMessage('Cover letter must be 5,000 characters or less')
  .customSanitizer((value) =>
    value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  );

const validateCandidateReference = body('candidateId')
  .isMongoId()
  .withMessage('Valid candidate ID required')
  .custom(async (value, { req }) => {
    const exists = await Application.findOne({
      jobId: req.params.jobId,
      candidateId: value,
    });
    if (exists) throw new Error('You have already applied to this job');
    return true;
  });

const validateInterview = [
  body('scheduledAt')
    .isISO8601()
    .withMessage('Interview time must be in ISO8601 format')
    .custom((value) => {
      if (new Date(value) < new Date())
        throw new Error('Interview time must be in the future');
      return true;
    }),
  createEnumValidator('interviewType', APPLICATION_METADATA.INTERVIEW_TYPES),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location must be 200 characters or less'),
  body('attendees')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must have between 1-5 attendees'),
  body('attendees.*.userId')
    .isMongoId()
    .withMessage('Attendee ID must be a valid MongoDB ObjectId'),
  body('attendees.*.role')
    .trim()
    .notEmpty()
    .withMessage('Attendee role is required')
    .isLength({ max: 50 })
    .withMessage('Attendee role must be 50 characters or less'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Feedback must be 2,000 characters or less'),
  createEnumValidator('result', APPLICATION_METADATA.INTERVIEW_RESULTS),
];

// Validation pipelines
const createApplicationValidationPipeline = (options = {}) => {
  const { isUpdate = false, includeInterview = false } = options;
  const pipeline = [
    isUpdate ? validateApplicationId : validateJobId,

    // Core application fields
    isUpdate ? validateCoverLetter.optional() : validateCoverLetter,
    isUpdate ?
      createEnumValidator('status', APPLICATION_METADATA.STATUSES).optional()
    : validateCandidateReference,

    // Conditionally include interview validation
    ...(includeInterview ? validateInterview : []),

    // Common fields
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes must be 2,000 characters or less'),
  ];

  return pipeline.concat(validatorMiddleware);
};

// Exported validators
exports.submitApplicationValidator = [
  ...createApplicationValidationPipeline(),
  body().custom((data, { req }) => {
    const allowed = ['candidateId', 'coverLetter'];
    const invalid = Object.keys(data).filter((f) => !allowed.includes(f));
    if (invalid.length)
      throw new Error(`Invalid fields for submission: ${invalid.join(', ')}`);
    return true;
  }),
];

exports.updateApplicationValidator = createApplicationValidationPipeline({
  isUpdate: true,
});
exports.scheduleInterviewValidator = createApplicationValidationPipeline({
  isUpdate: true,
  includeInterview: true,
});

exports.getApplicationValidator = [validateApplicationId, validatorMiddleware];

exports.getApplicationsByJobValidator = [
  validateJobId,
  query('status')
    .optional()
    .isIn(APPLICATION_METADATA.STATUSES.values)
    .withMessage('Invalid status filter'),
  query(['limit', 'page'])
    .optional()
    .isInt({ min: 1 })
    .withMessage('Must be a positive integer'),
  validatorMiddleware,
];

exports.getApplicationsByCandidateValidator = [
  validateCandidateId,
  query('status')
    .optional()
    .isIn(APPLICATION_METADATA.STATUSES.values)
    .withMessage('Invalid status filter'),
  query(['limit', 'page'])
    .optional()
    .isInt({ min: 1 })
    .withMessage('Must be a positive integer'),
  validatorMiddleware,
];

exports.deleteApplicationValidator = [
  validateApplicationId,
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be 500 characters or less'),
  validatorMiddleware,
];

exports.searchApplicationsValidator = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2-100 characters'),
  query(['jobId', 'candidateId'])
    .optional()
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId'),
  query('status')
    .optional()
    .isIn(APPLICATION_METADATA.STATUSES.values)
    .withMessage('Invalid status value'),
  query(['limit', 'page'])
    .optional()
    .isInt({ min: 1 })
    .withMessage('Must be a positive integer'),
  validatorMiddleware,
];
