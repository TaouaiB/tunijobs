// /modules/job/policies/job.rules.js

function defineJobRulesFor(user, can, cannot) {
  if (!user) {
    // Guest - allow read only active, non-confidential jobs
    cannot('manage', 'all');
    can('read', 'Job', { isActive: true, isConfidential: false });
    return;
  }

  switch (user.role) {
    case 'admin':
      can('manage', 'all');
      break;

    case 'company':
      can('create', 'Job');
      can('read', 'Job');
      can(['update', 'delete'], 'Job', { companyId: user.companyId });
      break;

    case 'candidate':
      can('read', 'Job', { isActive: true, isConfidential: false });
      break;

    default:
      cannot('manage', 'all');
      can('read', 'Job', { isActive: true, isConfidential: false });
      break;
  }
}

module.exports = { defineJobRulesFor };
