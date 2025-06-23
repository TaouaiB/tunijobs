const { buildAbilityFor } = require('../../auth/abilities/ability.factory');

function abilityInjector(req, res, next) {
  try {
    const user = req.user || null;
    req.ability = buildAbilityFor(user);
    
    console.log('Injected ability for user:', {
      id: user?.id,
      role: user?.role,
      companyId: user?.companyId
    });
    
    next();
  } catch (err) {
    console.error('Ability injection failed:', err);
    next(err);
  }
}

module.exports = abilityInjector;