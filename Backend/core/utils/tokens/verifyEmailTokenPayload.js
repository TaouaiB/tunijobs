const jwt = require('../../../modules/auth/utils/jwt');
const ApiError = require('../ApiError');

const verifyEmailTokenPayload = (token) => {
  if (!token) throw new ApiError(400, 'Token is missing');

  const decoded = jwt.verifyToken(token.trim());

  if (decoded.purpose !== 'verifyEmail') {
    throw new ApiError(400, 'Invalid token purpose');
  }

  return decoded;
};

module.exports = verifyEmailTokenPayload;
