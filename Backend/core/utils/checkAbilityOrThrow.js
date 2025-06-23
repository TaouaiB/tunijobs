const { ForbiddenError } = require('@casl/ability');
const ApiError = require('./ApiError');

/**
 * Runs CASL check and converts ForbiddenError into ApiError
 * @param {Ability} ability - CASL ability instance
 * @param {string} action - Action to check
 * @param {any} subject - Subject or resource to check against
 * @throws {ApiError} if permission denied
 */
function checkAbilityOrThrow(ability, action, subject) {
  try {
    ForbiddenError.from(ability).throwUnlessCan(action, subject);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw new ApiError(
        'Forbidden: You are not authorized to perform this action',
        403
      );
    }
    throw error;
  }
}

module.exports = checkAbilityOrThrow;
