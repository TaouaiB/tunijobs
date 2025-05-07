const asyncHandler = require('express-async-handler');

const ApiError = require('../../../core/utils/apiError');
const pickFields = require('../../../core/utils/pickFields');

const User = require('../models/userModel');

// @desc   Create a new user
// @route  POST /api/v1/users
// @access Public
exports.createUser = asyncHandler(async (req, res, next) => {
  const newUser = await User.create(
    pickFields(req.body, 'user', true) // Strict mode
  );

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

// @desc   Get all users
// @route  GET /api/v1/users
// @access Public
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// @desc   Get a user by ID
// @route  GET /api/v1/users/:id
// @access Public
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(`No user found with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc   Update a user by ID
// @route  PUT /api/v1/users/:id
// @access Public
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    pickFields(req.body, 'user', true), // Strict mode
    { new: true }
  );
  if (!user) {
    return next(new ApiError(`No user found with id: ${req.params.id}`, 404));
  }
  await user.save();
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc   Delete a user by ID
// @route  DELETE /api/v1/users/:id
// @access Public
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new ApiError(`No user found with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: null,
  });
});

// @desc   Block a user by ID
// @route  PUT /api/v1/users/:id/block
// @access Public
exports.blockUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(`No user found with id: ${req.params.id}`, 404));
  }
  if (user.isBlocked) {
    return next(
      new ApiError(`User with id: ${req.params.id} is already blocked`, 400)
    );
  }

  user.isBlocked = true;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc   Unblock a user by ID
// @route  PUT /api/v1/users/:id/unblock
// @access Public
exports.unblockUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(`No user found with id: ${req.params.id}`, 404));
  }
  if (!user.isBlocked) {
    return next(
      new ApiError(`User with id: ${req.params.id} is already unblocked`, 400)
    );
  }
  user.isBlocked = false;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc   Deactivate a user by ID
// @route  PUT /api/v1/users/:id/deactivate
// @access Public
exports.deactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(`No user found with id: ${req.params.id}`, 404));
  }
  if (user.isDeactivated) {
    return next(
      new ApiError(`User with id: ${req.params.id} is already deactivated`, 400)
    );
  }

  user.isDeactivated = true;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc   Reactivate a user by ID
// @route  PUT /api/v1/users/:id/reactivate
// @access Public
exports.reactivateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(`No user found with id: ${req.params.id}`, 404));
  }
  if (!user.isDeactivated) {
    return next(
      new ApiError(`User with id: ${req.params.id} is already reactivated`, 400)
    );
  }
  user.isDeactivated = false;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
