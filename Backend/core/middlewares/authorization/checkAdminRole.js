const ApiError = require('../../../core/utils/ApiError');

module.exports = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError('Access denied', 403));
  }
  next();
};