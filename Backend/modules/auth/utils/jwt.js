const jwt = require('jsonwebtoken');
const ApiError = require('../../../core/utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'your-app-name';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'your-app-client';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in production environment');
}

/**
 * JWT token signing with security practices
 * @param {Object} payload - Data to include in the token
 * @param {Object} [options] - Additional JWT options
 * @returns {string} Signed JWT token
 */
function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: 'HS256', // Explicitly set algorithm
    ...options
  });
}

/**
 * Verifies JWT token with additional security checks
 * @param {string} token - JWT token to verify
 * @param {Object} [options] - Additional verification options
 * @returns {Object} Decoded payload
 * @throws {ApiError} If token is invalid
 */
function verifyToken(token, options = {}) {
  if (!token) throw new ApiError('Authorization token is required', 401);

  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'], // Prevent algorithm switching attacks
      ...options
    });
  } catch (err) {
    // Specific error messages for different JWT errors
    const message = err.name === 'TokenExpiredError' 
      ? 'Token has expired' 
      : 'Invalid authentication token';
    throw new ApiError(message, 401);
  }
}

/**
 * Decodes JWT token without verification (for inspection only)
 * @param {string} token 
 * @returns {Object|null} Decoded payload or null
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Generates a random token for CSRF/password resets
 * @returns {string} Cryptographically secure random string
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  signToken,
  verifyToken,
  decodeToken,
  generateRandomToken
};