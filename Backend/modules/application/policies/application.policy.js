function defineApplicationRulesFor(user, can, cannot) {
  // NEW: Debug logging
  console.log('[POLICY] Processing rules for:', {
    role: user?.role,
    candidateId: user?.candidateId,
  });

  if (!user) {
    cannot('manage', 'all');
    return;
  }

  switch (user.role) {
    case 'admin':
      can('read', 'Application');
      can('delete', 'Application');
      break;

    case 'company':
      can('read', 'Application', { companyId: user.companyId });
      can('update', 'Application', { companyId: user.companyId });
      break;

    case 'jobSeeker':
      can('read', 'Application', { candidateId: user.candidateId });
      can('create', 'Application');
      can('withdraw', 'Application', { candidateId: user.candidateId });
      break;

    default:
      cannot('manage', 'all');
  }
}

module.exports = { defineApplicationRulesFor };
