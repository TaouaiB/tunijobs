const { body } = require('express-validator');
const {
  validateId,
  validateNameField,
  validateOptionalNameField,
  validateEmailField,
  validateOptionalEmailField,
  validatePasswordField,
  validateOptionalPasswordField,
  validatePhoneField,
  validateOptionalStringField,
  validateEnumField,
  validatorMiddleware,
} = require('../../../core/utils/validatorOrchestrator');

const User = require('../models/userModel');

// Constants
const USER_CONSTANTS = {
  ROLES: {
    values: ['jobSeeker', 'company', 'manager', 'admin'],
    description: 'User role type',
  },
  LIMITS: {
    NAME_MIN: 3,
    NAME_MAX: 32,
    PASSWORD_MIN: 6,
    CITY_MAX: 100,
    AVATAR_MAX: 255,
  },
  PHONE_LOCALE: 'ar-TN',
};

// Simplified Validators (removed redundant slugify)
const validateNameWithSlug = validateNameField(
  'name',
  USER_CONSTANTS.LIMITS.NAME_MIN,
  USER_CONSTANTS.LIMITS.NAME_MAX
);

const validateOptionalNameWithSlug = validateOptionalNameField(
  'name',
  USER_CONSTANTS.LIMITS.NAME_MIN,
  USER_CONSTANTS.LIMITS.NAME_MAX
);

const validateUniqueEmail = body('email').custom(async (value) => {
  const user = await User.findOne({ email: value });
  if (user) {
    throw new Error('Email already in use');
  }
  return true;
});

const validateUniqueEmailOnUpdate = body('email')
  .optional()
  .custom(async (value, { req }) => {
    const user = await User.findOne({ email: value });
    // Allow the same email for the current user during update
    if (user && user._id.toString() !== req.params.id) {
      throw new Error('Email already in use');
    }
    return true;
  });

// Validation Pipelines
exports.createUserValidator = [
  validateNameWithSlug,
  validateEmailField(),
  validateUniqueEmail,
  validatePasswordField('password', USER_CONSTANTS.LIMITS.PASSWORD_MIN),
  validatePhoneField('phone', USER_CONSTANTS.PHONE_LOCALE),
  validateOptionalStringField('city', USER_CONSTANTS.LIMITS.CITY_MAX),
  validateOptionalStringField('avatar', USER_CONSTANTS.LIMITS.AVATAR_MAX),
  validateEnumField('role', USER_CONSTANTS.ROLES).optional(),
  validatorMiddleware,
];

exports.getUserValidator = [validateId('id', 'User'), validatorMiddleware];

exports.updateUserValidator = [
  validateId('id', 'User'),
  validateOptionalNameWithSlug,
  validateOptionalEmailField(),
  validateUniqueEmailOnUpdate,
  validateOptionalPasswordField('password', USER_CONSTANTS.LIMITS.PASSWORD_MIN),
  validatePhoneField('phone', USER_CONSTANTS.PHONE_LOCALE).optional(),
  validateOptionalStringField('city', USER_CONSTANTS.LIMITS.CITY_MAX),
  validateOptionalStringField('avatar', USER_CONSTANTS.LIMITS.AVATAR_MAX),
  validateEnumField('role', USER_CONSTANTS.ROLES).optional(),
  validatorMiddleware,
];

exports.deleteUserValidator = [validateId('id', 'User'), validatorMiddleware];

exports.blockUserValidator = [validateId('id', 'User'), validatorMiddleware];

exports.unblockUserValidator = [validateId('id', 'User'), validatorMiddleware];

exports.deactivateUserValidator = [
  validateId('id', 'User'),
  validatorMiddleware,
];

exports.activateUserValidator = [validateId('id', 'User'), validatorMiddleware];
