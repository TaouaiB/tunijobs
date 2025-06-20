import { defineAbilityFor } from '../../auth/abilities/ability.factory'

export function abilityInjector(req, res, next) {
  if (!req.user) return next()
  req.ability = defineAbilityFor(req.user)
  next()
}
