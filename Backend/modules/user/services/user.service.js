const ApiError = require('../../../core/utils/ApiError');
const pickFields = require('../../../core/utils/pickFields');
const User = require('../models/userModel');

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
