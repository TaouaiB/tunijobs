const asyncHandler = require('express-async-handler');
const UserService = require('../services/user.service');

// @desc   Create a new user
// @route  POST /api/v1/users
// @access Public
exports.createUser = asyncHandler(async (req, res) => {
  const user = await UserService.createUser(req.body);
  res.status(201).json({ status: 'success', data: { user } });
});

// @desc   Get all users
// @route  GET /api/v1/users
// @access Public
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserService.getAllUsers();
  res
    .status(200)
    .json({ status: 'success', results: users.length, data: { users } });
});

// @desc   Get a user by ID
// @route  GET /api/v1/users/:id
// @access Public
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await UserService.getUserById(req.params.id);
  res.status(200).json({ status: 'success', data: { user } });
});

// @desc   Update a user by ID
// @route  PUT /api/v1/users/:id
// @access Public
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await UserService.updateUser(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: { user } });
});

// @desc   Delete a user by ID
// @route  DELETE /api/v1/users/:id
// @access Public
exports.deleteUser = asyncHandler(async (req, res) => {
  await UserService.deleteUser(req.params.id);
  res.status(200).json({ status: 'success', data: null });
});

// @desc   Block a user by ID
// @route  PUT /api/v1/users/:id/block
// @access Public
exports.blockUser = asyncHandler(async (req, res) => {
  const user = await UserService.blockUser(req.params.id);
  res.status(200).json({ status: 'success', data: { user } });
});

// @desc   Unblock a user by ID
// @route  PUT /api/v1/users/:id/unblock
// @access Public
exports.unblockUser = asyncHandler(async (req, res) => {
  const user = await UserService.unblockUser(req.params.id);
  res.status(200).json({ status: 'success', data: { user } });
});

// @desc   Deactivate a user by ID
// @route  PUT /api/v1/users/:id/deactivate
// @access Public
exports.deactivateUser = asyncHandler(async (req, res) => {
  const user = await UserService.deactivateUser(req.params.id);
  res.status(200).json({ status: 'success', data: { user } });
});

// @desc   Reactivate a user by ID
// @route  PUT /api/v1/users/:id/reactivate
// @access Public
exports.reactivateUser = asyncHandler(async (req, res) => {
  const user = await UserService.reactivateUser(req.params.id);
  res.status(200).json({ status: 'success', data: { user } });
});
