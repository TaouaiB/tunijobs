const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('jobSeeker', 'company', 'manager', 'admin').default('jobSeeker'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/**
 * Middleware to validate request body using given Joi schema.
 */
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({ status: 'fail', message: messages });
    }
    next();
  };
}

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
};
