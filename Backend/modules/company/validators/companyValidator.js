const { body, param } = require('express-validator');
const slugify = require('slugify');

const validatorMiddleware = require('../../../core/middlewares/validatorMiddleware');

// Constants matching model
const INDUSTRIES = [
  'IT/Software',
  'Finance/Banking',
  'Healthcare',
  'Manufacturing',
  'Education/Training',
  'Retail/E-commerce',
  'Hospitality/Tourism',
  'Government',
  'Other',
];

// ID Validators (Reusable)
const validateUserId = param('userId')
  .isMongoId()
  .withMessage('Invalid User ID');
const validateCompanyId = param('companyId')
  .isMongoId()
  .withMessage('Invalid Company ID');

// Field Validators (Modular)
const validateCompanyName = body('companyName')
  .trim()
  .notEmpty()
  .withMessage('Company name is required')
  .isLength({ max: 100 })
  .withMessage('Name too long (max 100 chars)')
  .custom((value, { req }) => {
    req.body.slug = slugify(value);
    return true;
  });

const validateIndustry = body('industry')
  .isIn(INDUSTRIES)
  .withMessage(`Invalid industry. Valid options: ${INDUSTRIES.join(', ')}`);

const validateDescription = body('description')
  .optional()
  .trim()
  .isLength({ max: 2000 })
  .withMessage('Description too long (max 2000 chars)');

const validateWebsite = body('website')
  .optional()
  .trim()
  .isURL({ require_protocol: true })
  .withMessage('Invalid URL (include http/https)');

const validateOffices = [
  body('offices').optional().isArray().withMessage('Offices must be an array'),
  body('offices.*.city')
    .trim()
    .notEmpty()
    .withMessage('Office city required')
    .isLength({ max: 50 })
    .withMessage('City name too long'),
  body('offices.*.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address too long'),
  body('offices.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be boolean'),
];

const validateSocialMedia = [
  body('socialMedia.linkedin')
    .optional()
    .trim()
    .isURL({ require_protocol: true })
    .withMessage('Invalid LinkedIn URL'),
  body('socialMedia.facebook')
    .optional()
    .trim()
    .isURL({ require_protocol: true })
    .withMessage('Invalid Facebook URL'),
];

// Combined Validators
exports.createCompanyValidator = [
  validateUserId,
  validateCompanyName,
  validateIndustry,
  validateDescription,
  validateWebsite,
  ...validateOffices,
  ...validateSocialMedia,
  validatorMiddleware,
];

exports.updateCompanyValidator = [
  validateUserId,
  validateCompanyName.optional(),
  validateIndustry.optional(),
  validateDescription,
  validateWebsite,
  ...validateOffices,
  ...validateSocialMedia,
  validatorMiddleware,
];

exports.getCompanyByUserIdValidator = [validateUserId, validatorMiddleware];

exports.getCompanyByIdValidator = [validateCompanyId, validatorMiddleware];

exports.deleteCompanyValidator = [validateUserId, validatorMiddleware];
