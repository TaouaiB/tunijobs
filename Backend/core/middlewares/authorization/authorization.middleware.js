const checkAbilityOrThrow = require('../../utils/checkAbilityOrThrow');
const ApiError = require('../../utils/ApiError');

function authorize(action, subject, getResource) {
  return async (req, res, next) => {
    try {
      const ability = req.ability;
      let resource = subject;

      if (getResource) {
        resource = await getResource(req);
        if (!resource) {
          return next(new ApiError(`${subject} not found`, 404));
        }
      }

      checkAbilityOrThrow(ability, action, resource);

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = authorize;
