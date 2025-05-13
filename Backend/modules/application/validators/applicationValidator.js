/**
 * @file Application validators for handling application-related request validation
 * @module validators/applicationValidator
 * @requires express-validator
 * @requires ../models/applicationModel
 * @requires ../../../core/validators/commonValidators
 */

const { body, param, query } = require('express-validator');
const Application = require('../models/applicationModel');
const {
  validateId,
  validateRequiredStringField,
  validateOptionalStringField,
  validateEnumField,
  validatorMiddleware,
} = require('../../../core/utils/validatorOrchestrator');

/**
 * Application metadata constants
 * @namespace APPLICATION_METADATA
 * @property {Object} STATUSES - Application status options
 * @property {string[]} STATUSES.values - Allowed status values
 * @property {string} STATUSES.description - Status field description
 * @property {Object} INTERVIEW_TYPES - Interview type options
 * @property {string[]} INTERVIEW_TYPES.values - Allowed interview types
 * @property {string} INTERVIEW_TYPES.description - Interview type description
 * @property {Object} INTERVIEW_RESULTS - Interview result options
 * @property {string[]} INTERVIEW_RESULTS.values - Allowed interview results
 * @property {string} INTERVIEW_RESULTS.description - Interview result description
 */
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

/**
 * Validates application ID parameter
 * @type {import('express-validator').ValidationChain}
 */
const validateApplicationId = validateId('id', 'application');

/**
 * Validates job ID parameter
 * @type {import('express-validator').ValidationChain}
 */
const validateJobId = validateId('jobId', 'job');

/**
 * Validates candidate ID parameter
 * @type {import('express-validator').ValidationChain}
 */
const validateCandidateId = validateId('candidateId', 'candidate');

/**
 * Validates and sanitizes cover letter field
 * @type {import('express-validator').ValidationChain}
 */
const validateCoverLetter = validateOptionalStringField(
  'coverLetter',
  5000
).customSanitizer((value) =>
  value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
);

/**
 * Validates candidate reference and checks for duplicate applications
 * @type {import('express-validator').ValidationChain}
 */
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

/**
 * Validates interview-related fields
 * @type {import('express-validator').ValidationChain[]}
 */
const validateInterview = [
  body('scheduledAt')
    .isISO8601()
    .withMessage('Interview time must be in ISO8601 format')
    .custom((value) => {
      if (!value.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(value)) {
        throw new Error('Timezone offset or Zulu time (Z) required');
      }
      if (new Date(value) < new Date()) {
        throw new Error('Interview time must be in the future');
      }
      return true;
    }),
  validateEnumField('interviewType', APPLICATION_METADATA.INTERVIEW_TYPES),
  validateOptionalStringField('location', 200),
  body('attendees')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must have between 1-5 attendees')
    .custom((attendees) => {
      const userIds = attendees.map((a) => a.userId);
      if (new Set(userIds).size !== userIds.length) {
        throw new Error('Duplicate attendees not allowed');
      }
      return true;
    }),
  body('attendees.*.userId')
    .isMongoId()
    .withMessage('Attendee ID must be a valid MongoDB ObjectId'),
  validateRequiredStringField('attendees.*.role', 50),
  validateOptionalStringField('feedback', 2000),
  validateEnumField('result', APPLICATION_METADATA.INTERVIEW_RESULTS),
];

/**
 * Creates application validation pipeline
 * @param {Object} options - Validation options
 * @param {boolean} [options.isUpdate=false] - Whether this is for an update operation
 * @param {boolean} [options.includeInterview=false] - Whether to include interview validation
 * @returns {import('express-validator').ValidationChain[]} Validation chain array
 */
const createApplicationValidationPipeline = (options = {}) => {
  const { isUpdate = false, includeInterview = false } = options;
  const pipeline = [
    isUpdate ? validateApplicationId : validateJobId,
    isUpdate ? validateCoverLetter : validateCoverLetter.optional(),
    isUpdate ?
      validateEnumField('status', APPLICATION_METADATA.STATUSES).optional()
    : validateCandidateReference,
    ...(includeInterview ? validateInterview : []),
    validateOptionalStringField('notes', 2000),
  ];

  return pipeline;
};

/**
 * Validator for submitting a new application
 * @type {import('express').RequestHandler[]}
 */
exports.submitApplicationValidator = [
  ...createApplicationValidationPipeline(),
  body().custom((data, { req }) => {
    const allowed = ['candidateId', 'coverLetter'];
    const invalid = Object.keys(data).filter((f) => !allowed.includes(f));
    if (invalid.length)
      throw new Error(`Invalid fields for submission: ${invalid.join(', ')}`);
    return true;
  }),
  validatorMiddleware,
];

/**
 * Validator for updating an application
 * @type {import('express').RequestHandler[]}
 */
exports.updateApplicationValidator = [
  ...createApplicationValidationPipeline({ isUpdate: true }),
  validatorMiddleware,
];

/**
 * Validator for scheduling an interview
 * @type {import('express').RequestHandler[]}
 */
exports.scheduleInterviewValidator = [
  ...createApplicationValidationPipeline({
    isUpdate: true,
    includeInterview: true,
  }),
  validatorMiddleware,
];

/**
 * Validator for getting a single application
 * @type {import('express').RequestHandler[]}
 */
exports.getApplicationValidator = [validateApplicationId, validatorMiddleware];

/**
 * Validator for getting applications by job
 * @type {import('express').RequestHandler[]}
 */
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

/**
 * Validator for getting applications by candidate
 * @type {import('express').RequestHandler[]}
 */
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

/**
 * Validator for deleting an application
 * @type {import('express').RequestHandler[]}
 */
exports.deleteApplicationValidator = [
  validateApplicationId,
  validateOptionalStringField('reason', 500),
  validatorMiddleware,
];

/**
 * Validator for searching applications
 * @type {import('express').RequestHandler[]}
 */
exports.searchApplicationsValidator = [
  validateOptionalStringField('q', 100),
  query().custom((query) => {
    const { jobId, candidateId } = query;
    if (!jobId && !candidateId) {
      throw new Error('At least one search parameter ( jobId, candidateId) is required');
    }
    return true;
  }),
  query(['jobId', 'candidateId'])
    .optional()
    .isMongoId()
    .withMessage('Must be a valid MongoDB ObjectId'),
  validateEnumField('status', APPLICATION_METADATA.STATUSES),
  query(['limit', 'page'])
    .optional()
    .isInt({ min: 1 })
    .withMessage('Must be a positive integer'),
  validatorMiddleware,
];
