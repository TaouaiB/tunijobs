const { body, param } = require('express-validator');
const {
  validateId,
  validateOptionalId,
  validateOptionalStringField,
  validateRequiredStringField,
  validateUrlField,
  validateEnumField,
  validatorMiddleware,
} = require('../../../core/utils/validatorOrchestrator');

const VALIDATION = require('../../../core/constants/validation');

// Constants
const CANDIDATE_CONSTANTS = {
  AVAILABILITY_OPTIONS: {
    values: ['immediate', '1-2 weeks', '1 month', '2-3 months', 'flexible'],
    description: 'Candidate availability status',
  },
  WORK_TYPES: {
    values: ['remote', 'onsite', 'hybrid'],
    description: 'Preferred work arrangement',
  },
  CONTRACT_TYPES: {
    values: ['full-time', 'part-time', 'freelance', 'internship', 'temporary'],
    description: 'Preferred contract type',
  },
};

// ID Validators
const validateCandidateIdParam = validateId('candidateId', 'Candidate');
const validateUserIdParam = validateId('userId', 'User');

// Field Validators
const validateHeadline = validateOptionalStringField('headline', 120);
const validateEducation = validateRequiredStringField('education');
const validateExperience = validateRequiredStringField('experience');
const validateBio = validateOptionalStringField('bio', 2000);

const validateResumeUrl = validateUrlField('resumeUrl');
const validateGithubUrl = validateUrlField('links.github');
const validateLinkedinUrl = validateUrlField('links.linkedin');

const validateOtherUrl = body('links.other')
  .optional()
  .isArray({ max: 3 })
  .withMessage('Maximum 3 additional links allowed')
  .custom((links) =>
    links.every((l) => validateUrlField().run({ body: { value: l.platform } }))
  );

const validateSkills = body('skills')
  .optional()
  .isArray({
    min: 1,
    max: VALIDATION.ARRAY_MAX_LIMITS.SKILLS,
  })
  .withMessage('Skills must be a non-empty array')
  .custom(
    (skills) =>
      Array.isArray(skills) && skills.every((s) => typeof s === 'string')
  )
  .withMessage('All skills must be strings');

const validateWorkTypes = body('jobTypePreferences.workType')
  .optional()
  .isArray()
  .withMessage('Work types must be an array')
  .custom(
    (types) =>
      Array.isArray(types) &&
      types.every((type) =>
        CANDIDATE_CONSTANTS.WORK_TYPES.values.includes(type)
      )
  )
  .withMessage(
    `Work types must be one of: ${CANDIDATE_CONSTANTS.WORK_TYPES.values.join(', ')}`
  );

const validateAvailability = validateEnumField(
  'jobPreferences.availability',
  CANDIDATE_CONSTANTS.AVAILABILITY_OPTIONS
);

const validateContractType = body('jobTypePreferences.contractType')
  .optional()
  .isArray()
  .withMessage('Contract types must be an array')
  .custom(
    (types) =>
      Array.isArray(types) &&
      types.every((type) =>
        CANDIDATE_CONSTANTS.CONTRACT_TYPES.values.includes(type)
      )
  )
  .withMessage(
    `Contract types must be one of: ${CANDIDATE_CONSTANTS.CONTRACT_TYPES.values.join(', ')}`
  );

/**
 * Validates salary range with orchestrated constraints
 * @returns {import('express-validator').ValidationChain[]}
 */
const validateSalaryRange = () => {
  const salaryField = 'jobTypePreferences.desiredSalary';
  const minField = `${salaryField}.min`;
  const maxField = `${salaryField}.max`;

  return [
    // Min salary validation
    body(minField)
      .optional()
      .isFloat({
        min: VALIDATION.SALARY.MIN,
        max: VALIDATION.SALARY.MAX,
      })
      .withMessage(
        `Minimum salary must be between ${VALIDATION.SALARY.MIN} and ${VALIDATION.SALARY.MAX}`
      )
      .bail()
      .custom((min, { req }) => {
        const max = req.body.jobTypePreferences?.desiredSalary?.max;
        return max === undefined || min <= max;
      })
      .withMessage('Minimum salary cannot exceed maximum salary'),

    // Max salary validation
    body(maxField)
      .optional()
      .isFloat({
        min: VALIDATION.SALARY.MIN,
        max: VALIDATION.SALARY.MAX,
      })
      .withMessage(
        `Maximum salary must be between ${VALIDATION.SALARY.MIN} and ${VALIDATION.SALARY.MAX}`
      )
      .bail()
      .custom((max, { req }) => {
        const min = req.body.jobTypePreferences?.desiredSalary?.min;
        return min === undefined || max >= min;
      })
      .withMessage('Maximum salary cannot be less than minimum salary'),
  ];
};

const validateJobTitles = body('preferredJobTitles')
  .optional()
  .isArray({ max: VALIDATION.ARRAY_MAX_LIMITS.JOB_TITLES || 5 })
  .withMessage('Maximum 5 preferred job titles allowed');

const validateCurrency = validateEnumField(
  'jobPreferences.salaryExpectation.currency',
  {
    values: VALIDATION.SALARY.CURRENCIES,
    description: 'Allowed currency codes',
  }
);
const validateLocations = body('jobPreferences.preferredLocations')
  .optional()
  .isArray()
  .withMessage('Preferred locations must be an array')
  .custom(
    (locs) =>
      Array.isArray(locs) && locs.every((loc) => typeof loc === 'string')
  )
  .withMessage('Each location must be a string');

const validateLanguages = body('languages')
  .optional()
  .isArray()
  .withMessage('Languages must be an array')
  .custom(
    (langs) =>
      Array.isArray(langs) && langs.every((lang) => typeof lang === 'string')
  )
  .withMessage('Each language must be a string');

// Common Validators
const commonCandidateValidators = [
  validateHeadline,
  validateEducation,
  validateExperience,
  validateBio,
  validateResumeUrl,
  validateGithubUrl,
  validateLinkedinUrl,
  validateOtherUrl,
  validateSkills,
  validateWorkTypes,
  validateAvailability,
  validateCurrency,
  validateJobTitles,
  validateLocations,
  validateLanguages,
];

// Validator Pipelines
exports.createCandidateValidator = [
  validateUserIdParam,
  ...commonCandidateValidators,
  ...validateSalaryRange(),
  validatorMiddleware,
];

exports.updateCandidateValidator = [
  validateUserIdParam,
  ...commonCandidateValidators.map(
    (validator) => (validator.optional && validator.optional()) || validator
  ),
  ...validateSalaryRange(),
  validatorMiddleware,
];

exports.getCandidateByUserIdValidator = [
  validateUserIdParam,
  validatorMiddleware,
];

exports.getCandidateByIdValidator = [
  validateCandidateIdParam,
  validatorMiddleware,
];

exports.deleteCandidateValidator = [
  validateCandidateIdParam,
  validatorMiddleware,
];
