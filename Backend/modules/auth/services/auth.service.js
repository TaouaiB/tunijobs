const bcrypt = require('bcryptjs');
const jwt = require('../utils/jwt');
const UserService = require('../../user/services/user.service');
const ApiError = require('../../../core/utils/ApiError');
const logger = require('../../../core/utils/logger/logger');

class AuthService {
  /**
   * Register a new user with email/password
   * @param {Object} userData - { email, password, name, role?, ... }
   * @returns {Promise<{user: Object, token: string}>}
   * @throws {ApiError} On validation/duplicate/creation errors
   */
  static async registerUser(userData) {
    const { email, password, ...profileData } = userData;

    logger.debug(`Registration attempt for email: ${email}`);

    // Early exit if user exists
    if (await UserService.userExists(email)) {
      logger.warn(`Duplicate registration attempt: ${email}`);
      throw new ApiError('Email already in use', 409);
    }

    try {
      const hashedPassword = await this.hashPassword(password);

      // Create user via UserService (with auth context)
      const user = await UserService.createUser(
        { email, ...profileData, password: hashedPassword },
        true // isAuthContext flag
      );

      logger.info(`New user registered: ${user._id}`);
      return this.generateAuthResponse(user);
    } catch (err) {
      logger.error('Registration failed', { error: err.stack, email });
      throw new ApiError('Registration failed. Please try again.', 500);
    }
  }

  /**
   * Authenticate existing user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: Object, token: string}>}
   * @throws {ApiError} On invalid credentials
   */
  static async loginUser(email, password) {
    logger.debug(`Login attempt for email: ${email}`);

    try {
      const user = await UserService.findByEmail(email, true); // Get with password

      if (!user || !(await this.verifyPassword(password, user.password))) {
        logger.warn(`Failed login attempt for: ${email}`);
        throw new ApiError('Invalid credentials', 401);
      }

      logger.info(`User authenticated: ${user._id}`);
      return this.generateAuthResponse(user);
    } catch (err) {
      if (!(err instanceof ApiError)) {
        logger.error('Login error', { error: err.stack, email });
        throw new ApiError('Authentication failed', 500);
      }
      throw err;
    }
  }

  // ------------ Helper Methods ------------

  /**
   * Generate hashed password
   * @private
   */
  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verify password against hash
   * @private
   */
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate standardized auth response
   * @private
   */
  static generateAuthResponse(user) {
    return {
      user: UserService.sanitizeUser(user),
      token: jwt.signToken({
        id: user._id,
        role: user.role,
        // Add other standard claims here (iss, exp, etc)
      }),
    };
  }
}

module.exports = AuthService;
