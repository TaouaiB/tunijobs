const ApiError = require('../../../core/utils/ApiError');
const path = require('path');
const pickFields = require('../../../core/utils/pickFields');
const User = require('../models/userModel');

const {
  processAvatar,
  cleanupFiles,
} = require('../../../core/utils/imageProcessor');

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
  static async updateAvatar(id, avatarInfo) {
    if (!id) throw new ApiError('User ID required', 400);
    if (!avatarInfo || !avatarInfo.filename) {
      throw new ApiError('Invalid avatar data', 400);
    }
  
    const user = await User.findById(id).select('avatar');
    if (!user) throw new ApiError('User not found', 404);
  
    const outputDir = path.join(process.cwd(), 'uploads/avatars');
  
    const filesToDelete = [];
    if (user.avatar && user.avatar !== 'default_avatar.jpg') {
      const oldBase = path.basename(user.avatar, '.webp');
      filesToDelete.push(
        path.join(outputDir, user.avatar),
        path.join(outputDir, `${oldBase}_thumb.webp`),
        path.join(outputDir, `${oldBase}_medium.webp`)
      );
    }
  
    try {
      await User.findByIdAndUpdate(id, { avatar: avatarInfo.filename });
  
      if (filesToDelete.length > 0) {
        await cleanupFiles(filesToDelete);
      }
  
      return {
        avatarUrl: avatarInfo.url,
        variants: avatarInfo.variants,
      };
    } catch (error) {
      await cleanupFiles([
        path.join(outputDir, avatarInfo.filename),
        ...avatarInfo.variants.map((v) => v.path),
      ]);
      throw error;
    }
  }
  /**
   * Reset avatar to default
   * @param {string} id - User ID
   */
  static async resetAvatar(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError('User not found', 404);

    if (user.avatar !== 'default_avatar.jpg') {
      const oldPath = path.join(
        __dirname,
        '../../../uploads/avatars',
        user.avatar
      );
      cleanupFiles([oldPath]);

      user.avatar = 'default_avatar.jpg';
      await user.save();
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
