const { body, param } = require('express-validator');
const {
  validateId,
  validateOptionalId,
  validateNameField,
  validateOptionalNameField,
  validateOptionalStringField,
  validateUrlField,
  validateEnumField,
  validatorMiddleware,
} = require('../../../core/utils/validatorOrchestrator');

// Constants
const COMPANY_CONSTANTS = {
  INDUSTRIES: {
    values: [
      'IT/Software',
      'Finance/Banking',
      'Healthcare',
      'Manufacturing',
      'Education/Training',
      'Retail/E-commerce',
      'Hospitality/Tourism',
      'Government',
      'Other',
    ],
    description: 'Company industry classification',
  },
  OFFICE: {
    MAX_CITY_LENGTH: 50,
    MAX_ADDRESS_LENGTH: 200,
  },
  DESCRIPTION: {
    MAX_LENGTH: 2000,
  },
};

// Field validators
const validateCompanyIdParam = validateId('companyId', 'Company');
const validateUserIdParam = validateId('userId', 'User');

const validateCompanyName = validateNameField('companyName', 1, 100);
const validateOptionalCompanyName = validateOptionalNameField(
  'companyName',
  1,
  100
);

const validateIndustry = validateEnumField(
  'industry',
  COMPANY_CONSTANTS.INDUSTRIES
);
const validateOptionalIndustry = validateEnumField(
  'industry',
  COMPANY_CONSTANTS.INDUSTRIES
).optional();

const validateDescription = validateOptionalStringField(
  'description',
  COMPANY_CONSTANTS.DESCRIPTION.MAX_LENGTH
);

const validateWebsite = validateUrlField('website').optional();

const validateOffices = [
  body('offices').optional().isArray().withMessage('Offices must be an array'),

  // Validate office city
  body('offices.*.city')
    .trim()
    .notEmpty()
    .withMessage('Office city is required')
    .isLength({ max: COMPANY_CONSTANTS.OFFICE.MAX_CITY_LENGTH })
    .withMessage(
      `City name must be ${COMPANY_CONSTANTS.OFFICE.MAX_CITY_LENGTH} characters or less`
    ),

  // Validate office address
  body('offices.*.address')
    .optional()
    .trim()
    .isLength({ max: COMPANY_CONSTANTS.OFFICE.MAX_ADDRESS_LENGTH })
    .withMessage(
      `Address must be ${COMPANY_CONSTANTS.OFFICE.MAX_ADDRESS_LENGTH} characters or less`
    ),

  // Validate office isPrimary flag
  body('offices.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be boolean')
    .toBoolean(),

  // Ensure only one primary office (if any)
  body('offices')
    .custom((offices) => {
      if (!Array.isArray(offices)) return true;
      const primaryCount = offices.filter((o) => o.isPrimary === true).length;
      return primaryCount <= 1;
    })
    .withMessage('Only one office can be marked as primary.'),
];

const validateSocialMedia = [
  validateUrlField('socialMedia.linkedin').optional(),
  validateUrlField('socialMedia.facebook').optional(),
];

// Validation pipelines
exports.createCompanyValidator = [
  validateUserIdParam,
  validateCompanyName,
  validateIndustry,
  validateDescription,
  validateWebsite,
  ...validateOffices,
  ...validateSocialMedia,
  validatorMiddleware,
];

exports.updateCompanyValidator = [
  validateUserIdParam,
  validateOptionalCompanyName,
  validateOptionalIndustry,
  validateDescription,
  validateWebsite,
  ...validateOffices,
  ...validateSocialMedia,
  validatorMiddleware,
];

exports.getCompanyByUserIdValidator = [
  validateUserIdParam,
  validatorMiddleware,
];

exports.getCompanyByIdValidator = [validateCompanyIdParam, validatorMiddleware];

exports.deleteCompanyValidator = [validateUserIdParam, validatorMiddleware];
