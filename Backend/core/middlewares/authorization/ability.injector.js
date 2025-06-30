const { buildAbilityFor } = require('../../auth/abilities/ability.factory');

function abilityInjector(req, res, next) {
  try {
    const user = req.user || null;
    req.ability = buildAbilityFor(user);

    console.log('[ABILITY DEBUG] User BEFORE ability build:', {
      id: user?.id,
      role: user?.role,
      candidateId: user?.candidateId,
      companyId: user?.companyId,
    });

    next();
  } catch (err) {
    console.error('Ability injection failed:', err);
    next(err);
  }
}

module.exports = abilityInjector;
