// modules/user/services/documents/storage.service.js
const path = require('path');
const fs = require('fs-extra');
const User = require('../../models/userModel');
const ApiError = require('../../../../core/utils/ApiError');
const cleanupFiles = require('../../../../core/utils/cleanupFiles');

module.exports = {
  /**
   * Store processed avatar variants
   * @param {string} userId
   * @param {Object} imageInfo - From your imageUploadHandler
   * @param {Array} imageInfo.variants - Processed variants
   * @returns {Promise<Object>} Updated user data
   */
  async storeImage(userId, imageInfo) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError('User not found', 404);

    // Cleanup previous avatar if exists
    if (user.avatar?.medium) {
      await this._cleanupPreviousAvatar(user.avatar.medium);
    }

    // Prepare avatar update
    const avatarUpdate = {
      'avatar.medium': imageInfo.variants.find((v) => v.suffix === '-md').url,
      'avatar.thumbnail': imageInfo.variants.find((v) => v.suffix === '-thumb')
        .url,
      updatedAt: new Date(),
    };

    const updatedUser = await User.findByIdAndUpdate(userId, avatarUpdate, {
      new: true,
      runValidators: true,
    });

    return {
      user: updatedUser,
      variants: imageInfo.variants,
    };
  },

  /**
   * Reset avatar to default
   * @param {string} userId
   * @returns {Promise<Object>} Reset result
   */
  async resetAvatar(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError('User not found', 404);

    // Skip if no custom avatar
    if (!user.avatar?.medium || user.avatar.medium.includes('default_avatar')) {
      return {
        status: 'success',
        message: 'Already using default avatar',
        avatar: user.avatar,
      };
    }

    // Cleanup existing files
    await this._cleanupPreviousAvatar(user.avatar.medium);

    // Reset to default (matches your constants)
    user.avatar = {
      medium: '/uploads/avatars/default_avatar-md.webp',
      thumbnail: '/uploads/avatars/default_avatar-thumb.webp',
    };
    await user.save();

    return {
      status: 'success',
      message: 'Avatar reset to default',
      avatar: user.avatar,
    };
  },

  // Private helper to cleanup previous avatar files
  async _cleanupPreviousAvatar(mediumVariantUrl) {
    try {
      const baseName = path
        .basename(mediumVariantUrl, '.webp')
        .replace('-md', '');
      const uploadDir = path.join(process.cwd(), 'uploads/avatars');

      const filesToDelete = [
        path.join(uploadDir, `${baseName}-md.webp`),
        path.join(uploadDir, `${baseName}-thumb.webp`),
      ];

      await cleanupFiles(filesToDelete);
    } catch (error) {
      console.error('Avatar cleanup error:', error);
    }
  },
};
