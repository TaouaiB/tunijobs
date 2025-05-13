const { body, param } = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const VALIDATION = require('../constants/validation');

// ==============================================
// Core Field Validators
// ==============================================

/**
 * Validate a required MongoDB ObjectId from params
 * @param {string} field - Param field name
 * @param {string} entity - Entity name for error messaging
 * @returns {import('express-validator').ValidationChain}
 */
const validateId = (field, entity) =>
  param(field).isMongoId().withMessage(`Invalid ${entity} ID format`);

/**
 * Validate an optional MongoDB ObjectId from params
 * @param {string} field - Param field name
 * @param {string} entity - Entity name for error messaging
 * @returns {import('express-validator').ValidationChain}
 */
const validateOptionalId = (field, entity) =>
  param(field)
    .optional()
    .bail()
    .isMongoId()
    .withMessage(`Invalid ${entity} ID format`);

/**
 * Validate a required name field with slug generation
 * @param {string} field - Field name
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {import('express-validator').ValidationChain}
 */
const validateNameField = (
  field,
  min = VALIDATION.NAME_MIN_LENGTH,
  max = VALIDATION.NAME_MAX_LENGTH
) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min })
    .withMessage(`${field} must be at least ${min} characters`)
    .isLength({ max })
    .withMessage(`${field} must be at most ${max} characters`)
    .custom((value, { req }) => {
      req.body.slug = slugify(value, VALIDATION.SLUGIFY_OPTIONS);
      return true;
    });

/**
 * Validate an optional name field with slug generation
 * @param {string} field - Field name
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {import('express-validator').ValidationChain}
 */
const validateOptionalNameField = (
  field,
  min = VALIDATION.NAME_MIN_LENGTH,
  max = VALIDATION.NAME_MAX_LENGTH
) =>
  body(field)
    .optional()
    .bail()
    .trim()
    .isLength({ min })
    .withMessage(`${field} must be at least ${min} characters`)
    .isLength({ max })
    .withMessage(`${field} must be at most ${max} characters`)
    .custom((value, { req }) => {
      if (value) {
        req.body.slug = slugify(value, VALIDATION.SLUGIFY_OPTIONS);
      }
      return true;
    });

/**
 * Validate a required email field
 * @param {string} field - Field name
 * @returns {import('express-validator').ValidationChain}
 */
const validateEmailField = (field = 'email') =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail();

/**
 * Validate an optional email field
 * @param {string} field - Field name
 * @returns {import('express-validator').ValidationChain}
 */
const validateOptionalEmailField = (field = 'email') =>
  body(field)
    .optional()
    .bail()
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail();

/**
 * Validate a required password field
 * @param {string} field - Field name
 * @param {number} min - Minimum length
 * @returns {import('express-validator').ValidationChain}
 */
const validatePasswordField = (
  field = 'password',
  min = VALIDATION.PASSWORD_MIN_LENGTH
) =>
  body(field)
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min })
    .withMessage(`Password must be at least ${min} characters`);

/**
 * Validate an optional password field
 * @param {string} field - Field name
 * @param {number} min - Minimum length
 * @returns {import('express-validator').ValidationChain}
 */
const validateOptionalPasswordField = (
  field = 'password',
  min = VALIDATION.PASSWORD_MIN_LENGTH
) =>
  body(field)
    .optional()
    .bail()
    .isLength({ min })
    .withMessage(`Password must be at least ${min} characters`);

/**
 * Validate an optional phone number field
 * @param {string} field - Field name
 * @param {string} locale - Locale for mobile phone validation
 * @returns {import('express-validator').ValidationChain}
 */
const validatePhoneField = (
  field = 'phone',
  locale = VALIDATION.PHONE_LOCALE
) =>
  body(field)
    .optional()
    .bail()
    .isMobilePhone(locale)
    .withMessage(`Please provide a valid ${locale} phone number`);

/**
 * Validates a URL field with protocol checking
 * @param {string} field - Field name to validate
 * @param {string[]|object} [protocols=['http', 'https']] - Either:
 *   - Array of allowed protocols (e.g., ['https'])
 *   - Configuration object { protocols: string[], require_protocol: boolean }
 * @returns {import('express-validator').ValidationChain}
 */
const validateUrlField = (
  field,
  protocols = VALIDATION.URL?.PROTOCOLS || ['http', 'https']
) => {
  // Handle both array and object configurations
  const protocolConfig =
    Array.isArray(protocols) ?
      { protocols, require_protocol: VALIDATION.URL?.REQUIRE_PROTOCOL ?? true }
    : {
        protocols: protocols.protocols || ['http', 'https'],
        require_protocol:
          protocols.require_protocol ??
          VALIDATION.URL?.REQUIRE_PROTOCOL ??
          true,
      };

  // Validate protocols
  if (!Array.isArray(protocolConfig.protocols)) {
    throw new Error('URL protocols must be an array');
  }

  return body(field)
    .optional()
    .bail()
    .trim()
    .isURL(protocolConfig)
    .withMessage(
      `Invalid URL - must use ${protocolConfig.protocols.join(' or ')} ` +
        `protocol${protocolConfig.protocols.length > 1 ? 's' : ''}`
    );
};
/**
 * Validate an optional string field with max length
 * @param {string} field - Field name
 * @param {number} max - Maximum length
 * @returns {import('express-validator').ValidationChain}
 */
const validateOptionalStringField = (
  field,
  max = VALIDATION.DEFAULT_MAX_LENGTH
) =>
  body(field)
    .optional()
    .bail()
    .trim()
    .isLength({ max })
    .withMessage(`${field} must be ${max} characters or less`);

/**
 * Validate a required string field with max length
 * @param {string} field - Field name
 * @param {number} max - Maximum length
 * @returns {import('express-validator').ValidationChain}
 */
const validateRequiredStringField = (
  field,
  max = VALIDATION.DEFAULT_MAX_LENGTH
) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ max })
    .withMessage(`${field} must be ${max} characters or less`);

/**
 * Validate a field against allowed enum values
 * @param {string} field - Field name
 * @param {{ values: string[], description: string }} meta - Allowed values and description
 * @returns {import('express-validator').ValidationChain}
 */
const validateEnumField = (field, meta) =>
  body(field)
    .optional()
    .bail()
    .isIn(meta.values)
    .withMessage(
      `Invalid ${field}. Valid options: ${meta.values.join(', ')} (${meta.description})`
    );

// ==============================================
// Validation Pipelines
// ==============================================

/**
 * Create a validator pipeline for creating an entity
 * @param {{ includePassword?: boolean }} options
 * @returns {Array} Middleware array
 */
const createEntityValidator = ({ includePassword = false } = {}) => {
  const pipeline = [
    validateNameField('name'),
    validateEmailField(),
    ...(includePassword ? [validatePasswordField()] : []),
    validatePhoneField(),
    validateOptionalStringField('city'),
    validateOptionalStringField('avatar'),
  ];
  return [...pipeline, validatorMiddleware];
};

/**
 * Create a validator pipeline for updating an entity
 * @param {{ includePassword?: boolean }} options
 * @returns {Array} Middleware array
 */
const updateEntityValidator = ({ includePassword = false } = {}) => {
  const pipeline = [
    validateId('id', 'entity'),
    validateOptionalNameField('name'),
    validateOptionalEmailField(),
    ...(includePassword ? [validateOptionalPasswordField()] : []),
    validatePhoneField(),
    validateOptionalStringField('city'),
    validateOptionalStringField('avatar'),
  ];
  return [...pipeline, validatorMiddleware];
};

/**
 * Validator pipeline for getting an entity by ID
 * @returns {Array} Middleware array
 */
const getEntityValidator = () => [
  validateId('id', 'entity'),
  validatorMiddleware,
];

/**
 * Validator pipeline for deleting an entity by ID
 * @returns {Array} Middleware array
 */
const deleteEntityValidator = () => [
  validateId('id', 'entity'),
  validatorMiddleware,
];

module.exports = {
  // Field validators
  validateId,
  validateOptionalId,
  validateNameField,
  validateOptionalNameField,
  validateEmailField,
  validateOptionalEmailField,
  validatePasswordField,
  validateOptionalPasswordField,
  validatePhoneField,
  validateUrlField,
  validateOptionalStringField,
  validateRequiredStringField,
  validateEnumField,

  // Pipelines
  createEntityValidator,
  updateEntityValidator,
  getEntityValidator,
  deleteEntityValidator,

  // Middleware
  validatorMiddleware,
};
