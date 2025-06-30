const { AbilityBuilder, createMongoAbility } = require('@casl/ability');
const {
  defineJobRulesFor,
} = require('../../../modules/job/policies/job.rules');
const {
  defineApplicationRulesFor,
} = require('../../../modules/application/policies/application.policy');
const { Types } = require('mongoose');

function normalizeId(id) {
  return id?.toString ? id.toString() : id;
}

function buildAbilityFor(user) {
  const { can, cannot, rules } = new AbilityBuilder(createMongoAbility);

  // Create a normalized user object with string IDs
  const normalizedUser = {
    ...user,
    companyId: normalizeId(user?.companyId),
  };

  // Add rules from all modules
  defineJobRulesFor(normalizedUser, can, cannot);
  defineApplicationRulesFor(user, can, cannot);
  // Add other module rules here...

  console.log('Built ability with rules:', rules);
  return new createMongoAbility(rules, {
    detectSubjectType: (item) => item.__type || item.constructor.name,
  });
}

module.exports = { buildAbilityFor, normalizeId };
