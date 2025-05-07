const { body, param } = require('express-validator');
const validatorMiddleware = require('../../../core/middlewares/validatorMiddleware');

// Constants
const VALID_AVAILABILITY_OPTIONS = [
  'immediate',
  '1-2 weeks',
  '1 month',
  '2-3 months',
  'flexible',
];

const VALID_WORK_TYPES = ['remote', 'onsite', 'hybrid'];

const VALID_CONTRACT_TYPES = [
  'full-time',
  'part-time',
  'freelance',
  'internship',
  'temporary',
];

// Validate :userId param (for user-based operations)
exports.validateUserIdParam = [
  param('userId').isMongoId().withMessage('Invalid User ID format'),
  validatorMiddleware,
];

// Validate :candidateId param (for candidate document ID)
exports.validateCandidateIdParam = [
  param('candidateId').isMongoId().withMessage('Invalid Candidate ID format'),
  validatorMiddleware,
];

// Common fields for create and update
exports.commonCandidateValidators = [
  // Professional Details
  body('headline')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Headline must be a string under 120 characters'),

  body('education')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Education must be a non-empty string'),

  body('experience')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Experience must be a non-empty string'),

  body('skills')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Skills must be a non-empty array')
    .custom((skills) => skills.every((skill) => typeof skill === 'string'))
    .withMessage('All skills must be strings'),

  body('resumeUrl')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Resume must be a valid HTTP/HTTPS URL'),

  body('bio')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Bio must be a string under 2000 characters'),

  // Documents & Links

  body('resumeUrl')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Resume URL must be valid'),

  body('links.github')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('GitHub URL must be valid'),

  body('links.linkedin')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('LinkedIn URL must be valid'),

  body('links.other.platform')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Each link must be a valid URL'),

  // Job Preferences
  body('jobPreferences.workType')
    .optional()
    .isArray()
    .withMessage('Work type must be an array')
    .custom((types) => types.every((type) => VALID_WORK_TYPES.includes(type)))
    .withMessage(`Work type must be one of: ${VALID_WORK_TYPES.join(', ')}`),

  body('jobTypePreferences.availability')
    .optional()
    .isIn(VALID_AVAILABILITY_OPTIONS)
    .withMessage(
      `Availability must be one of: ${VALID_AVAILABILITY_OPTIONS.join(', ')}`
    ),

  body('jobPreferences.contractTypes')
    .optional()
    .isArray()
    .withMessage('Contract types must be an array')
    .custom((types) =>
      types.every((type) => VALID_CONTRACT_TYPES.includes(type))
    )
    .withMessage(
      `Contract type must be one of: ${VALID_CONTRACT_TYPES.join(', ')}`
    ),

  body('jobPreferences.salaryExpectation.amount')
    .optional()
    .isNumeric()
    .withMessage('Salary amount must be a number'),

  body('jobPreferences.preferredLocations')
    .optional()
    .isArray()
    .withMessage('Preferred locations must be an array')
    .custom((locs) => locs.every((loc) => typeof loc === 'string'))
    .withMessage('Each location must be a string'),

  // Additional Details
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array')
    .custom((langs) => langs.every((lang) => typeof lang === 'string'))
    .withMessage('Each language must be a string'),
];

// Create candidate validator
exports.createCandidateValidator = [
  ...exports.validateUserIdParam,
  ...exports.commonCandidateValidators,
  body('education')
    .exists()
    .withMessage('Education is required')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Education must be a non-empty string'),

  body('experience')
    .exists()
    .withMessage('Experience is required')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Experience must be a non-empty string'),

  validatorMiddleware,
];

// Update candidate validator
exports.updateCandidateValidator = [
  ...exports.validateUserIdParam,
  ...exports.commonCandidateValidators,
  validatorMiddleware,
];

// Get candidate (by userId) validator
exports.getCandidateByUserIdValidator = [...exports.validateUserIdParam];

// Delete candidate validator (based on candidate Id)
exports.deleteCandidateValidator = [...exports.validateCandidateIdParam];
