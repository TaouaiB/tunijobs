const { body, param, query } = require('express-validator');
const {
  validateId,
  validateNameField,
  validateOptionalNameField,
  validateRequiredStringField,
  validateOptionalStringField,
  validateEnumField,
  validateUrlField,
  validatorMiddleware,
} = require('../../../core/utils/validatorOrchestrator');

// Constants
const JOB_CONSTANTS = {
  TYPES: {
    values: [
      'full-time',
      'part-time',
      'contract',
      'internship',
      'temporary',
      'freelance',
    ],
    description: 'Employment arrangement type',
  },
  LOCATIONS: {
    values: ['remote', 'onsite', 'hybrid'],
    description: 'Work location arrangement',
  },
  LEVELS: {
    values: ['entry', 'mid', 'senior', 'lead'],
    description: 'Required experience level',
  },
  LIMITS: {
    TITLE_MAX: 100,
    DESCRIPTION_MAX: 10000,
    CITY_MAX: 50,
    ADDRESS_MAX: 200,
    SKILL_MAX: 50,
    BENEFIT_MAX: 100,
    META_DESC_MAX: 160,
  },
};

// Field validators
const validateJobId = validateId('id', 'Job');
const validateCompanyId = validateId('companyId', 'Company');

const validateTitle = validateNameField(
  'title',
  1,
  JOB_CONSTANTS.LIMITS.TITLE_MAX
);
const validateOptionalTitle = validateOptionalNameField(
  'title',
  1,
  JOB_CONSTANTS.LIMITS.TITLE_MAX
);

const validateDescription = validateRequiredStringField(
  'description',
  JOB_CONSTANTS.LIMITS.DESCRIPTION_MAX
);
const validateJobType = validateEnumField('jobType', JOB_CONSTANTS.TYPES);
const validateLocationType = validateEnumField(
  'locationType',
  JOB_CONSTANTS.LOCATIONS
);
const validateExperienceLevel = validateEnumField(
  'experienceLevel',
  JOB_CONSTANTS.LEVELS
);

const validatePrimaryLocation = [
  body('primaryLocation')
    .isObject()
    .withMessage('primaryLocation must be an object'),
  validateRequiredStringField(
    'primaryLocation.city',
    JOB_CONSTANTS.LIMITS.CITY_MAX
  ),
  validateOptionalStringField(
    'primaryLocation.address',
    JOB_CONSTANTS.LIMITS.ADDRESS_MAX
  ),
];

const validateSkills = [
  body('skillsRequired')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('skillsRequired.*.name')
    .trim()
    .notEmpty()
    .withMessage('Skill name cannot be empty')
    .isLength({ max: JOB_CONSTANTS.LIMITS.SKILL_MAX })
    .withMessage(
      `Skill name must be ${JOB_CONSTANTS.LIMITS.SKILL_MAX} characters or less`
    ),
];

const validateApplicationDeadline = body('applicationDeadline')
  .optional()
  .isISO8601()
  .withMessage('Deadline must be in ISO8601 format')
  .custom((value) => {
    if (new Date(value) < new Date()) {
      throw new Error('Application deadline must be in the future');
    }
    return true;
  });

const validateReferralBonus = body('referralBonus.amount')
  .optional()
  .isFloat({ min: 0 })
  .withMessage('Referral bonus must be a positive number');

const validateBenefits = body('benefits')
  .optional()
  .isArray()
  .withMessage('Benefits must be an array')
  .custom((benefits) => {
    return benefits.every(
      (b) =>
        typeof b === 'string' && b.length <= JOB_CONSTANTS.LIMITS.BENEFIT_MAX
    );
  })
  .withMessage(
    `Each benefit must be a string under ${JOB_CONSTANTS.LIMITS.BENEFIT_MAX} characters`
  );

const validateStatusFlags = [
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be boolean'),
  body('isConfidential')
    .optional()
    .isBoolean()
    .withMessage('isConfidential must be boolean'),
];

const validateMetaData = [
  body('meta.keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  validateOptionalStringField(
    'meta.description',
    JOB_CONSTANTS.LIMITS.META_DESC_MAX
  ),
];

// Validation pipelines
const createJobValidationPipeline = (isUpdate = false) => {
  const pipeline = [
    isUpdate ? validateJobId : validateCompanyId,
    isUpdate ? validateOptionalTitle : validateTitle,
    isUpdate ? validateDescription.optional() : validateDescription,
    isUpdate ? validateJobType.optional() : validateJobType,
    isUpdate ? validateLocationType.optional() : validateLocationType,
    ...validatePrimaryLocation.map((v) => (isUpdate ? v.optional() : v)),
    ...validateSkills.map((v) => (isUpdate ? v.optional() : v)),
    isUpdate ? validateExperienceLevel.optional() : validateExperienceLevel,
    validateApplicationDeadline,
    validateReferralBonus,
    validateBenefits,
    ...validateStatusFlags,
    ...validateMetaData.map((v) => v.optional()),
  ];

  return pipeline.concat(validatorMiddleware);
};

// Exported validators
exports.createJobValidator = createJobValidationPipeline(false);
exports.updateJobValidator = createJobValidationPipeline(true);

exports.patchJobValidator = [
  validateJobId,
  body().isObject().notEmpty().withMessage('Update data cannot be empty'),
  ...createJobValidationPipeline(true),
];

exports.getJobValidator = [
  validateJobId,
  query('populate')
    .optional()
    .isString()
    .withMessage('Populate must be a string'),
  query('fields').optional().isString().withMessage('Fields must be a string'),
  validatorMiddleware,
];

exports.deleteJobValidator = [
  validateJobId,
  query('confirm')
    .optional()
    .isBoolean()
    .withMessage('Confirm flag must be boolean'),
  validatorMiddleware,
];

exports.searchJobsValidator = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2–100 characters'),
  query('location')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Location filter must be 50 characters or less'),
  query('remote')
    .optional()
    .isBoolean()
    .withMessage('Remote filter must be boolean'),
  validatorMiddleware,
];
