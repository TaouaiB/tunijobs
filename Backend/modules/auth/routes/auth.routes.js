const router = require('express').Router();

const { register, login } = require('../controllers/auth.controller');

const {
  verifyEmailController,
} = require('../controllers/verifyEmail.controller');

const {
  validateRegister,
  validateLogin,
} = require('../validators/auth.validators');

const {
  requestPasswordResetController,
  resetPasswordController,
} = require('../controllers/resetPassword.controller');

const controller = require('../controllers/resendEmail.controller');

// POST /auth/password-reset/request
router.post('/password-reset/request', requestPasswordResetController);

// POST /auth/password-reset/reset
router.post('/password-reset/reset', resetPasswordController);

router.post(
  '/resend-verification-email',
  controller.resendVerificationEmailHandler
);
router.post(
  '/resend-password-reset-email',
  controller.resendPasswordResetEmailHandler
);

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

router.post('/reset-password', resetPasswordController);

router.get('/verify-email', verifyEmailController);

module.exports = router;
