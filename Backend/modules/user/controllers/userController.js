const asyncHandler = require('express-async-handler');
const UserService = require('../services/user.service');
const imageUploadHandler = require('../../../core/middlewares/multer/imageUploadHandler');

/**
 * @desc    Update user avatar
 * @route   PUT /api/v1/users/me/avatar
 * @access  Private
 * @param   {Object} req.file - Uploaded file from middleware
 * @param   {string} req.file.path - Path to the uploaded file
 * @param   {string} req.file.filename - Filename of the uploaded file
 * @param   {string} req.file.mimetype - MIME type of the uploaded file
 * @param   {string} req.file.size - Size of the uploaded file
 * @returns {Object} Updated user data with new avatar URL
 */
exports.updateAvatar = [
  imageUploadHandler,
  asyncHandler(async (req, res) => {
    const userId = req.params.id; // get user id from URL params

    const result = await UserService.storeImage(userId, req.imageInfo);

    res.status(201).json({
      status: 'success',
      data: result,
    });
  }),
];

exports.resetAvatar = asyncHandler(async (req, res) => {
  const result = await UserService.resetAvatar(req.params.id);
  res.status(200).json({
    status: 'success',
    message: result.message,
    data: {
      avatarUrl: '/uploads/avatars/default_avatar-md.jpg',
      avatarThumbnailUrl: '/uploads/avatars/default_avatar-thumb.jpg',
    },
  });
});

/**
 * @desc    Create a new user
 * @route   POST /api/v1/users
 * @access  Public
 * @param   {Object} req.body - User data
 * @returns {Object} Created user data
 */
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await UserService.createUser(req.body);
  res.status(201).json({
    status: 'success',
    data: { user },
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/v1/users
 * @access  Public
 * @returns {Object} List of users
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await UserService.getAllUsers();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/users/:id
 * @access  Public
 * @param   {string} req.params.id - User ID
 * @returns {Object} User data
 */
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await UserService.getUserById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * @desc    Update user by ID
 * @route   PUT /api/v1/users/:id
 * @access  Public
 * @param   {string} req.params.id - User ID
 * @param   {Object} req.body - Updated user data
 * @returns {Object} Updated user data
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await UserService.updateUser(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * @desc    Delete user by ID
 * @route   DELETE /api/v1/users/:id
 * @access  Public
 * @param   {string} req.params.id - User ID
 * @returns {Object} Empty response
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  await UserService.deleteUser(req.params.id);
  res.status(204).json(); // 204 No Content is more appropriate for DELETE
});

/**
 * @desc    Block user by ID
 * @route   PUT /api/v1/users/:id/block
 * @access  Public
 * @param   {string} req.params.id - User ID
 * @returns {Object} Updated user data
 */
exports.blockUser = asyncHandler(async (req, res, next) => {
  const user = await UserService.blockUser(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * @desc    Unblock user by ID
 * @route   PUT /api/v1/users/:id/unblock
 * @access  Public
 * @param   {string} req.params.id - User ID
 * @returns {Object} Updated user data
 */
exports.unblockUser = asyncHandler(async (req, res, next) => {
  const user = await UserService.unblockUser(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * @desc    Deactivate user by ID
 * @route   PUT /api/v1/users/:id/deactivate
 * @access  Public
 * @param   {string} req.params.id - User ID
 * @returns {Object} Updated user data
 */
exports.deactivateUser = asyncHandler(async (req, res, next) => {
  const user = await UserService.deactivateUser(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * @desc    Reactivate user by ID
 * @route   PUT /api/v1/users/:id/reactivate
 * @access  Public
 * @param   {string} req.params.id - User ID
 * @returns {Object} Updated user data
 */
exports.reactivateUser = asyncHandler(async (req, res, next) => {
  const user = await UserService.reactivateUser(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});
