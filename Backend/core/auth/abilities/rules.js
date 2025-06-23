const { normalizeId } = require('../../auth/abilities/ability.factory');

function defineJobRulesFor(user, can, cannot) {
  const userCompanyId = normalizeId(user?.companyId);
  
  console.log('Defining job rules for:', {
    role: user?.role,
    companyId: userCompanyId
  });

  switch (user?.role) {
    case 'admin':
      can('manage', 'all');
      break;
    case 'company':
      can('read', 'Job');
      can(['create', 'update', 'delete'], 'Job', {
        companyId: userCompanyId
      });
      break;
    case 'candidate':
      can('read', 'Job');
      can(['apply'], 'Job');
      break;
    default:
      cannot('manage', 'all');
  }
}

module.exports = { defineJobRulesFor };