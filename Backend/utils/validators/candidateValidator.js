const { body, param } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

// Constants
const VALID_AVAILABILITY_OPTIONS = [
  'immediate',
  '1 week',
  '2 weeks',
  '1 month',
  '2 months',
  '3 months',
  '3+ months',
];

// Validate :userId param (for user-based operations)
exports.validateUserIdParam = [
  param('userId').isMongoId().withMessage('Invalid User ID format'),
  validatorMiddleware,
];

// Validate :id param (for candidate document ID)
exports.validateCandidateIdParam = [
  param('candidateId').isMongoId().withMessage('Invalid Candidate ID format'),
  validatorMiddleware,
];

// Common fields for create and update
exports.commonCandidateValidators = [
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

  body('links.github')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('GitHub URL must be valid'),

  body('links.linkedin')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('LinkedIn URL must be valid'),

  body('links.other.url')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Each link must be a valid URL'),

  body('jobTypePreferences.workType.*')
    .optional()
    .isString()
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('Each work type must be a non-empty string'),

  body('jobTypePreferences.availability')
    .optional()
    .isIn(VALID_AVAILABILITY_OPTIONS)
    .withMessage(
      `Availability must be one of: ${VALID_AVAILABILITY_OPTIONS.join(', ')}`
    ),

  body('jobTypePreferences.contractType.*')
    .optional()
    .isString()
    .toLowerCase()
    .trim()
    .notEmpty()
    .withMessage('Each contract type must be a non-empty string'),

  body('jobTypePreferences.desiredSalary.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),

  body('jobTypePreferences.desiredSalary.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number')
    .custom((max, { req }) => {
      if (
        req.body.jobTypePreferences?.desiredSalary?.min &&
        max < req.body.jobTypePreferences.desiredSalary.min
      ) {
        throw new Error('Maximum salary must be greater than minimum salary');
      }
      return true;
    }),

  body('preferredJobTitles.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each job title must be a non-empty string'),

  body('languages.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each language must be a non-empty string'),
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

// Get single candidate (by userId) validator
exports.getCandidateByUserIdValidator = [...exports.validateUserIdParam];

// Delete candidate validator (uses :id)
exports.deleteCandidateValidator = [...exports.validateUserIdParam];
