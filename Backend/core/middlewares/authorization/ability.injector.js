const { buildAbilityFor } = require('../../auth/abilities/ability.factory');

/**
 * Middleware to build and inject CASL Ability into req.ability
 */
function abilityInjector(req, res, next) {
  try {
    const user = req.user || null;
    req.ability = buildAbilityFor(user);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = abilityInjector;
