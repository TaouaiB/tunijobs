const bcrypt = require('bcryptjs');
const jwt = require('../utils/jwt');
const User = require('../../user/models/userModel');
const ApiError = require('../../../core/utils/ApiError');
const logger = require('../../../core/utils/logger/logger');

class AuthService {
  static async registerUser(userData) {
    const { email, password, name, role } = userData;

    logger.debug(`Registration attempt for email: ${email}`);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Duplicate registration attempt: ${email}`);
      throw new ApiError('Email already in use', 409);
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({ email, password: hashedPassword, name, role });
      
      logger.info(`New user created: ${user._id} (${role})`);
      return user;

    } catch (err) {
      logger.error('User registration failed', { error: err.message });
      throw new ApiError('Registration failed', 500);
    }
  }

  static async loginUser(email, password) {
    logger.debug(`Login attempt for email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Login attempt for non-existent email: ${email}`);
      throw new ApiError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password for user: ${user._id}`);
      throw new ApiError('Invalid credentials', 401);
    }

    logger.info(`User logged in: ${user._id}`);
    return { user, token: jwt.signToken({ id: user._id, role: user.role }) };
  }
}

module.exports = AuthService;