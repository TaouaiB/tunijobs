const checkAbilityOrThrow = require('../../utils/checkAbilityOrThrow');
const ApiError = require('../../utils/ApiError');
const { Types } = require('mongoose');

function normalizeId(id) {
  return id?.toString ? id.toString() : id;
}

function authorize(action, subject, getResource) {
  return async (req, res, next) => {
    try {
      const ability = req.ability;
      if (!ability) {
        return next(new ApiError('User ability is not defined', 500));
      }

      let resource = subject;

      if (getResource) {
        resource = await getResource(req);
        if (!resource) {
          return next(new ApiError(`${subject} not found`, 404));
        }

        // Normalize all ObjectId fields to strings
        if (Types.ObjectId.isValid(resource.companyId)) {
          resource.companyId = normalizeId(resource.companyId);
        }

        // Ensure CASL can detect the subject type
        resource.__type = subject;
      }

      checkAbilityOrThrow(ability, action, resource);
      next();
    } catch (error) {
      if (error instanceof ApiError) return next(error);
      return next(new ApiError(error.message || 'Authorization failed', 403));
    }
  };
}

module.exports = authorize;