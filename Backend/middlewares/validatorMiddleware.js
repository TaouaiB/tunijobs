const { validationResult } = require('express-validator');

// @desc Validator middleware to check for errors in the request body
const validatorMiddleware = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	// If all good it will continue to next MW , which is the handler
	next();
};

module.exports = validatorMiddleware;
