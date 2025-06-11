const router = require('express').Router();

const { register, login } = require('../controllers/auth.controller');

const {
  verifyEmailController,
} = require('../controllers/verifyEmail.controller');

const {
  validateRegister,
  validateLogin,
} = require('../validators/auth.validators');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

router.get('/verify-email', verifyEmailController);

module.exports = router;
