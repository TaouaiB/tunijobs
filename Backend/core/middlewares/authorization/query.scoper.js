import { accessibleRecordsPlugin } from '@casl/mongoose'

export function applyQueryScope(model, ability, action = 'read') {
  model.plugin(accessibleRecordsPlugin)
  return model.accessibleBy(ability, action)
}
