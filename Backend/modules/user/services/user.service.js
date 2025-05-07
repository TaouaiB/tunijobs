const ApiError = require('../../../core/utils/ApiError.js');
const pickFields = require('../../../core/utils/pickFields');

const User = require('../models/userModel');

class UserService {
  // Create User
  static async createUser(userData) {
    return await User.create(pickFields(userData, 'user', true));
  }

  // Get All Users
  static async getAllUsers() {
    return await User.find({});
  }

  // Get Single User
  static async getUserById(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    return user;
  }

  // Update User
  static async updateUser(id, updateData) {
    const user = await User.findByIdAndUpdate(
      id,
      pickFields(updateData, 'user', true),
      { new: true }
    );
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    await user.save();
    return user;
  }

  // Delete User
  static async deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    return user;
  }

  // Block User
  static async blockUser(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    if (user.isBlocked)
      throw new ApiError(`User with id: ${id} is already blocked`, 400);

    user.isBlocked = true;
    await user.save();
    return user;
  }

  // Unblock User
  static async unblockUser(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    if (!user.isBlocked)
      throw new ApiError(`User with id: ${id} is already unblocked`, 400);

    user.isBlocked = false;
    await user.save();
    return user;
  }

  // Deactivate User
  static async deactivateUser(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);
    if (user.isDeactivated)
      throw new ApiError(`User with id: ${id} is already deactivated`, 400);

    user.isDeactivated = true;
    await user.save();
    return user;
  }

  // Reactivate User
  static async reactivateUser(id) {
    const user = await User.findById(id);
    if (!user) throw new ApiError(`No user found with id: ${id}`, 404);

    if (user.isBlocked)
      throw new ApiError(
        `User with id: ${id} is blocked and cannot be activated`,
        400
      );

    if (!user.isDeactivated)
      throw new ApiError(`User with id: ${id} is already reactivated`, 400);

    user.isDeactivated = false;
    await user.save();
    return user;
  }
}

module.exports = UserService;
