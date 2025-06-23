const checkAbilityOrThrow = require('../../utils/checkAbilityOrThrow');
const ApiError = require('../../utils/ApiError');

function authorize(action, subject, getResource) {
  return async (req, res, next) => {
    try {
      if (!req.ability) {
        return next(new ApiError('User ability is not defined', 500));
      }

      let resource = subject;

      if (getResource) {
        resource = await getResource(req);
        if (!resource) {
          return next(new ApiError(`${subject} not found`, 404));
        }
      }

      checkAbilityOrThrow(req.ability, action, resource);

      next();
    } catch (error) {
      console.log('Caught error in authorize:', error);
      if (error instanceof ApiError) {
        return next(error);
      }
      return next(new ApiError(error.message || 'Authorization failed', 403));
    }
  };
}

module.exports = authorize;
