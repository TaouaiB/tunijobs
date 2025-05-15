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
    // Configuration constants
    const REQUIRED_VARIANTS = {
      medium: '-md',
      thumbnail: '-thumb',
    };

    // Validate input structure
    if (!imageInfo?.variants || !Array.isArray(imageInfo.variants)) {
      throw new ApiError('Invalid image variants format', 400);
    }

    // Find required variants in one pass
    const variantMap = imageInfo.variants.reduce((acc, variant) => {
      if (variant?.suffix && variant?.url) {
        Object.entries(REQUIRED_VARIANTS).forEach(([key, suffix]) => {
          if (variant.suffix === suffix) acc[key] = variant.url;
        });
      }
      return acc;
    }, {});

    // Check all required variants exist
    if (
      Object.keys(variantMap).length !== Object.keys(REQUIRED_VARIANTS).length
    ) {
      throw new ApiError('Missing required image variants', 400);
    }

    // Database operations
    const user = await User.findById(id);
    if (!user) throw new ApiError('User not found', 404);

    // Update avatar with atomic operation
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          'avatar.medium': variantMap.medium,
          'avatar.thumbnail': variantMap.thumbnail,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    return {
      user: updatedUser,
      avatar: {
        medium: variantMap.medium,
        thumbnail: variantMap.thumbnail,
      },
    };
  }
  /**
   * Reset avatar to default
   * @param {string} id - User ID
   */
  static async resetAvatar(id) {
    const DEFAULT_AVATARS = {
      medium: 'default_avatar-md.jpg',
      thumbnail: 'default_avatar-thumb.jpg',
    };
    const AVATAR_DIR = path.join(__dirname, '../../../uploads/avatars');
    const AVATAR_URL_PREFIX = '/uploads/avatars';

    const user = await User.findById(id).orFail(() => {
      throw new ApiError('User not found', 404);
    });

    const hasCustomAvatar = () => {
      const { avatar } = user;
      return (
        avatar?.medium &&
        avatar.medium !== DEFAULT_AVATARS.medium &&
        typeof avatar.medium === 'string'
      );
    };

    if (!hasCustomAvatar()) {
      return {
        status: 'success',
        message: 'No custom avatar to reset.',
        avatarUrl: `${AVATAR_URL_PREFIX}/${user.avatar?.medium || DEFAULT_AVATARS.medium}`,
        avatarThumbnailUrl: `${AVATAR_URL_PREFIX}/${user.avatar?.thumbnail || DEFAULT_AVATARS.thumbnail}`,
      };
    }

    // Process custom avatar removal
    const extractBaseName = (filename) =>
      path.basename(filename).replace(/(-md|-thumb)?\.webp$/, '');

    const baseName = extractBaseName(user.avatar.medium);
    const avatarVariants = ['-md.webp', '-thumb.webp'];
    const filesToRemove = avatarVariants.map((variant) =>
      path.join(AVATAR_DIR, `${baseName}${variant}`)
    );

    try {
      await cleanupFiles(filesToRemove);

      // Update user with default avatars
      user.avatar = { ...DEFAULT_AVATARS };
      await user.save();

      return {
        status: 'success',
        message: 'Avatar reset to default successfully.',
        avatarUrl: `${AVATAR_URL_PREFIX}/${DEFAULT_AVATARS.medium}`,
        avatarThumbnailUrl: `${AVATAR_URL_PREFIX}/${DEFAULT_AVATARS.thumbnail}`,
      };
    } catch (error) {
      throw new ApiError(`Failed to reset avatar: ${error.message}`, 500);
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
