const asyncHandler = require('express-async-handler');
const AuthService = require('../services/auth.service');

exports.register = asyncHandler(async (req, res) => {
  const user = await AuthService.registerUser(req.body);
  res.status(201).json({ status: 'success', data: { user } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await AuthService.loginUser(email, password);
  res.json({ status: 'success', data: { user, token } });
});
