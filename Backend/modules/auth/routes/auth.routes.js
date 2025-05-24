const router = require('express').Router();

const { register, login } = require('../controllers/auth.controller');
const {
  validateRegister,
  validateLogin,
} = require('../validators/auth.validators');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

module.exports = router;
