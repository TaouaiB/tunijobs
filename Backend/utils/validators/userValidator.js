const { check, body } = require('express-validator');
const slugify = require('slugify');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');

exports.createUserValidator = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long')
    .isLength({ max: 32 })
    .withMessage('Name must be at most 32 characters long')
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        return Promise.reject(new Error('Email already in use'));
      }
    }),
  check('phone')
    .optional()
    .isMobilePhone('ar-TN')
    .withMessage('Please provide a Tunisian valid phone number'),
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  check('country')
    .optional()
    .isString()
    .withMessage('Country must be a string'),
  check('profileImg')
    .optional()
    .isString()
    .withMessage('Profile image must be a string'),
  check('role').optional().isIn(['user', 'admin']),

  validatorMiddleware,
];

exports.getUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id format'),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id format'),
  body('name')
    .optional()
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long')
    .isLength({ max: 32 })
    .withMessage('Name must be at most 32 characters long')
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        return Promise.reject(new Error('Email already in use'));
      }
    }),
  check('phone')
    .optional()
    .isMobilePhone('ar-TN')
    .withMessage('Please provide a Tunisian valid phone number'),
  check('country')
    .optional()
    .isString()
    .withMessage('Country must be a string'),
  check('profileImg')
    .optional()
    .isString()
    .withMessage('Profile image must be a string'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['user', 'admin']),

  validatorMiddleware,
];

exports.deleteUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id format'),
  validatorMiddleware,
];

exports.blockUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id format'),
  validatorMiddleware,
];

exports.unblockUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id format'),
  validatorMiddleware,
];

exports.deactivateUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id format'),
  validatorMiddleware,
];

exports.activateUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id format'),
  validatorMiddleware,
];
