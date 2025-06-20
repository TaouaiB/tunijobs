export function defineRulesForRole(user, can, cannot) {
  switch (user.role) {
    case 'admin':
      can('manage', 'all')
      break
    case 'company':
      can('read', 'Job')
      can(['create', 'update', 'delete'], 'Job', { userId: user.id })
      break
    case 'candidate':
      can('read', 'Job')
      break
    default:
      cannot('manage', 'all')
  }
}
