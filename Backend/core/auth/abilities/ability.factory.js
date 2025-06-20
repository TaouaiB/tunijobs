import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import { defineRulesForRole } from './rules'

export function defineAbilityFor(user) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility)

  defineRulesForRole(user, can, cannot)

  return build({ detectSubjectType: item => item.__type || item.constructor.name })
}
