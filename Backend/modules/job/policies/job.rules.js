// /modules/job/policies/job.rules.js

const { AbilityBuilder, Ability } = require('@casl/ability');

function defineJobRulesFor(user) {
  const { can, cannot, rules } = new AbilityBuilder(Ability);

  if (!user) {
    // Guest - no permissions (or you can allow read only public jobs)
    cannot('manage', 'all');
    can('read', 'Job', { isActive: true, isConfidential: false });
    return new Ability(rules);
  }

  switch (user.role) {
    case 'admin':
      can('manage', 'all'); // admin can do anything
      break;

    case 'company':
      can('create', 'Job');
      can('read', 'Job'); // company can read all jobs

      // company can update and delete only jobs they own (match companyId)
      can(['update', 'delete'], 'Job', { companyId: user.companyId });
      break;

    case 'candidate':
      // candidates can only read active, non-confidential jobs
      can('read', 'Job', { isActive: true, isConfidential: false });
      break;

    default:
      cannot('manage', 'all');
      can('read', 'Job', { isActive: true, isConfidential: false });
      break;
  }

  return new Ability(rules);
}

module.exports = { defineJobRulesFor };
