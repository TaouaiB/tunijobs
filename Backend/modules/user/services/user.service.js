const ApiError = require('../../../core/utils/ApiError');
const fs = require('fs/promises');
const path = require('path');
const pickFields = require('../../../core/utils/pickFields');
const User = require('../models/userModel');
const avatarStorage = require('./documents/storage.service');

/**
 * Service layer for user-related operations
 */
class UserService {
  /**
   * Check if user exists by email
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  static async userExists(email) {
    return Boolean(await this.findByEmail(email));
  }

  /**
   * Find user by email (with password selection option)
   * @param {string} email
   * @param {boolean} [withPassword=false]
   * @returns {Promise<User|null>}
   */
  static async findByEmail(email, withPassword = false) {
    const query = User.findOne({ email });
    return withPassword ? query.select('+password') : query;
  }

  /**
   * Create a new user (now handles both auth and non-auth cases)
   * @param {Object} userData
   * @param {boolean} [isAuthContext=false] - Set true when called from auth flow
   * @returns {Promise<User>}
   */
  static async createUser(userData, isAuthContext = false) {
    // Only apply field filtering for non-auth cases
    const data = isAuthContext ? userData : pickFields(userData, 'user', true);
    return User.create(data);
  }

  /**
   * Sanitize user object by removing sensitive fields
   * @param {User} user
   * @returns {Object}
   */
  static sanitizeUser(user) {
    const userObj = user.toObject?.() || user;
    const { password, __v, ...sanitized } = userObj;
    return sanitized;
  }

  /**
   * Update user avatar (with critical cleanup)
   * @param {string} id - User ID
   * @param {Object} avatarInfo - { filename: string, url: string }
   * @returns {Promise<{ avatarUrl: string, filename: string }>}
   * @throws {ApiError} If any step fails
   */
  static async storeImage(id, imageInfo) {
    return avatarStorage.storeImage(id, imageInfo);
  }

  /**
   * Reset avatar to default
   * @param {string} id - User ID
   */
  static async resetAvatar(id) {
    return avatarStorage.resetAvatar(id);
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
