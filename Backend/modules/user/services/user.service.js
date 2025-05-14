const ApiError = require('../../../core/utils/ApiError');
const fs = require('fs/promises');
const path = require('path');
const pickFields = require('../../../core/utils/pickFields');
const User = require('../models/userModel');
const cleanupFiles = require('../../../core/utils/cleanupFiles');

/**
 * Service layer for user-related operations
 */
class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data to create
   * @returns {Promise<User>} Created user
   * @throws {ApiError} If validation fails
   */
  static async createUser(userData) {
    return await User.create(pickFields(userData, 'user', true));
  }

  /**
   * Update user avatar (with critical cleanup)
   * @param {string} id - User ID
   * @param {Object} avatarInfo - { filename: string, url: string }
   * @returns {Promise<{ avatarUrl: string, filename: string }>}
   * @throws {ApiError} If any step fails
   */
  static async storeImage(id, imageInfo) {
    const user = await User.findById(id);
    if (!user) throw new ApiError('User not found', 404);

    if (imageInfo.variants && Array.isArray(imageInfo.variants)) {
      const mediumObj = imageInfo.variants.find((v) => v.suffix === '-md');
      const thumbnailObj = imageInfo.variants.find(
        (v) => v.suffix === '-thumb'
      ); // <-- here

      if (!mediumObj || !thumbnailObj) {
        throw new ApiError('Images not found', 400);
      }

      user.avatar.medium = mediumObj.url;
      user.avatar.thumbnail = thumbnailObj.url;

      await user.save();

      return user;
    }

    throw new ApiError('Images not found', 400);
  }

  /**
   * Reset avatar to default
   * @param {string} id - User ID
   */
  static async resetAvatar(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError('User not found', 404);

    // Check if user.avatar.medium is set and not default
    if (
      user.avatar &&
      typeof user.avatar.medium === 'string' &&
      user.avatar.medium !== 'default_avatar-md.jpg'
    ) {
      // Extract filename only, no folder path
      const avatarFilename = path.basename(user.avatar.medium);

      // Remove suffix (-md or -thumb) and extension to get baseName
      const baseName = avatarFilename.replace(/(-md|-thumb)?\.webp$/, '');

      const avatarDir = path.join(__dirname, '../../../uploads/avatars');

      const pathsToRemove = [
        path.join(avatarDir, `${baseName}-md.webp`),
        path.join(avatarDir, `${baseName}-thumb.webp`),
      ];

      // Delete avatar files
      await cleanupFiles(pathsToRemove);

      // Reset avatar fields to defaults
      user.avatar.medium = 'default_avatar-md.jpg';
      user.avatar.thumbnail = 'default_avatar-thumb.jpg';
      await user.save();

      return {
        status: 'success',
        message: 'Avatar reset to default successfully.',
        avatarUrl: `/uploads/avatars/${user.avatar.medium}`,
        avatarThumbnailUrl: `/uploads/avatars/${user.avatar.thumbnail}`,
      };
    } else {
      return {
        status: 'success',
        message: 'No custom avatar to reset.',
        avatarUrl: `/uploads/avatars/${user.avatar.medium || 'default_avatar-md.jpg'}`,
        avatarThumbnailUrl: `/uploads/avatars/${user.avatar.thumbnail || 'default_avatar-thumb.jpg'}`,
      };
    }
  }

  /**
   * Get all users
   * @param {Object} [filters={}] - Optional filters
   * @returns {Promise<Array<User>>} List of users
   */
  static async getAllUsers(filters = {}) {
    return await User.find(filters).select('-password');
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>} User object
   * @throws {ApiError} If user not found
   */
  static async getUserById(id) {
    const user = await User.findById(id).select('-password');
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    return user;
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<User>} Updated user
   * @throws {ApiError} If user not found or validation fails
   */
  static async updateUser(id, updateData) {
    const user = await User.findByIdAndUpdate(
      id,
      pickFields(updateData, 'user', true),
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    return user;
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>} Deleted user
   * @throws {ApiError} If user not found
   */
  static async deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    return user;
  }

  /**
   * Block user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>} Updated user
   * @throws {ApiError} If user not found or already blocked
   */
  static async blockUser(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    if (user.isBlocked) {
      throw new ApiError(`User with id: ${id} is already blocked`, 400);
    }
    user.isActive = false;
    user.isDeactivated = true;
    user.isBlocked = true;
    await user.save();
    return user;
  }

  /**
   * Unblock user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>} Updated user
   * @throws {ApiError} If user not found or already unblocked
   */
  static async unblockUser(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    if (!user.isBlocked) {
      throw new ApiError(`User with id: ${id} is already unblocked`, 400);
    }

    user.isBlocked = false;
    await user.save();
    return user;
  }

  /**
   * Deactivate user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>} Updated user
   * @throws {ApiError} If user not found or already deactivated
   */
  static async deactivateUser(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    if (user.isDeactivated) {
      throw new ApiError(`User with id: ${id} is already deactivated`, 400);
    }

    user.isDeactivated = true;
    await user.save();
    return user;
  }

  /**
   * Reactivate user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>} Updated user
   * @throws {ApiError} If user not found, blocked, or already active
   */
  static async reactivateUser(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    if (user.isBlocked) {
      throw new ApiError(
        `User with id: ${id} is blocked and cannot be reactivated`,
        400
      );
    }
    if (!user.isDeactivated) {
      throw new ApiError(`User with id: ${id} is already active`, 400);
    }

    user.isDeactivated = false;
    await user.save();
    return user;
  }
}

module.exports = UserService;
