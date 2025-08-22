function defineApplicationRulesFor(user, can, cannot) {
  console.log('[POLICY] Processing rules for:', {
    role: user?.role,
    candidateId: user?.candidateId,
    companyId: user?.companyId,
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
      if (user.companyId) {
        can('read', 'Application', { 'job.companyId': user.companyId });
        can('update', 'Application', {
          'job.companyId': user.companyId,
        });
      }
      break;

    case 'jobSeeker':
      if (user.candidateId) {
        can('read', 'Application', { candidateId: user.candidateId });
        can('create', 'Application');
        can('add-document', 'Application', { candidateId: user.candidateId });
        can('withdraw', 'Application', {
          candidateId: user.candidateId,
          status: 'submitted',
        });
      }
      break;

    default:
      cannot('manage', 'all');
  }
}

module.exports = { defineApplicationRulesFor };
