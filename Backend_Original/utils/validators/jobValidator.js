const { body, param, query } = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

// Constants with enhanced metadata
const JOB_METADATA = {
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
};

// Dynamic enum validator generator
const createEnumValidator = (field, meta) =>
  body(field)
    .isIn(meta.values)
    .withMessage(
      `Invalid ${field}. Valid options: ${meta.values.join(', ')} (${meta.description})`
    );

// ID Validators with enhanced messages
const validateId = (field, entity) =>
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${entity} ID format (must be MongoDB ObjectId)`);

const validateJobId = validateId('id', 'Job');
const validateCompanyId = validateId('companyId', 'Company');

// Enhanced title validator with SEO-friendly slug
const validateTitle = body('title')
  .trim()
  .notEmpty()
  .withMessage('Job title is required')
  .isLength({ max: 100 })
  .withMessage('Title must be 100 characters or less')
  .customSanitizer((value, { req }) => {
    const slug = slugify(value, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    req.body.slug = slug; // Directly assign the slug
    return value;
  });

// Rich text validator with HTML sanitization
const validateDescription = body('description')
  .trim()
  .notEmpty()
  .withMessage('Job description is required')
  .isLength({ max: 10000 })
  .withMessage('Description must be 10,000 characters or less')
  .customSanitizer((value) => {
    // Basic HTML sanitization - would use DOMPurify or similar in production
    return value.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    );
  });

// Location validator with geocoding hint
const validatePrimaryLocation = [
  body('primaryLocation.city')
    .trim()
    .notEmpty()
    .withMessage('City is required for job location')
    .isLength({ max: 50 })
    .withMessage('City name must be 50 characters or less')
    .custom((value, { req }) => {
      // Hint for potential geocoding integration
      req.body.locationKeywords = [
        value.toLowerCase(),
        ...(req.body.primaryLocation.address || '').toLowerCase().split(/\s+/),
      ].filter(Boolean);
      return true;
    }),

  body('primaryLocation.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be 200 characters or less')
    .customSanitizer((value) => value.replace(/\s+/g, ' ')), // Normalize whitespace
];

// Skills validator with deduplication
const validateSkillsRequired = [
  body('skillsRequired')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Skills must be an array (max 20 skills)'),

  body('skillsRequired.*.name')
    .trim()
    .notEmpty()
    .withMessage('Skill name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Skill name must be 50 characters or less')
    .custom((value, { req }) => {
      // Deduplicate skills case-insensitively
      if (req.body.skillsRequired) {
        const skillsLower = req.body.skillsRequired.map((s) =>
          s.name.toLowerCase()
        );
        if (
          skillsLower.indexOf(value.toLowerCase()) !==
          skillsLower.lastIndexOf(value.toLowerCase())
        ) {
          throw new Error(`Duplicate skill detected: ${value}`);
        }
      }
      return true;
    }),
];

// Enhanced deadline validator with timezone consideration
const validateApplicationDeadline = body('applicationDeadline')
  .optional()
  .isISO8601()
  .withMessage(
    'Deadline must be in ISO8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)'
  )
  .custom((value, { req }) => {
    const deadline = new Date(value);
    const now = new Date();

    if (deadline < now) {
      throw new Error('Application deadline must be in the future');
    }

    // Warn if deadline is more than 6 months away
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    if (deadline > sixMonthsFromNow) {
      req.body.deadlineWarning =
        'Consider setting a deadline within 6 months for better candidate response';
    }

    return true;
  });

// Unified validation pipeline
const createValidationPipeline = (isUpdate = false) => {
  const pipeline = [
    isUpdate ? validateJobId : validateCompanyId,

    // Core fields
    isUpdate ? validateTitle.optional() : validateTitle,
    isUpdate ? validateDescription.optional() : validateDescription,
    createEnumValidator('jobType', JOB_METADATA.TYPES).optional(isUpdate),
    createEnumValidator('locationType', JOB_METADATA.LOCATIONS).optional(
      isUpdate
    ),
    ...validatePrimaryLocation.map((v) => (isUpdate ? v.optional() : v)),
    ...validateSkillsRequired.map((v) => (isUpdate ? v.optional() : v)),
    createEnumValidator('experienceLevel', JOB_METADATA.LEVELS).optional(
      isUpdate
    ),
    validateApplicationDeadline,

    // Optional fields
    body('referralBonus.amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Referral bonus must be a positive number'),

    body('benefits.*')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Benefit must be 100 characters or less'),

    body(['isActive', 'isFeatured', 'isConfidential'])
      .optional()
      .isBoolean()
      .withMessage('Status flags must be boolean values'),

    // SEO metadata
    body('meta.keywords')
      .optional()
      .isArray({ max: 10 })
      .withMessage('SEO keywords must be an array (max 10 items)'),

    body('meta.description')
      .optional()
      .isLength({ max: 160 })
      .withMessage('Meta description must be 160 characters or less'),
  ];

  return pipeline.concat(validatorMiddleware);
};

// Export creative validators
exports.createJobValidator = createValidationPipeline(false);
exports.updateJobValidator = createValidationPipeline(true);
exports.patchJobValidator = [
  validateJobId,
  body().isObject().notEmpty().withMessage('Update data cannot be empty'),
  ...createValidationPipeline(true),
];

exports.getJobValidator = [
  validateJobId,
  query(['populate', 'fields'])
    .optional()
    .isString()
    .withMessage('Query params must be strings'),
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

// Bonus: Job search validator
exports.searchJobsValidator = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2-100 characters'),

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
