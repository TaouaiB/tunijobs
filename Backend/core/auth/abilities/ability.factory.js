// /core/auth/abilities/ability.factory.js

const { AbilityBuilder, createMongoAbility } = require('@casl/ability');
const { defineJobRulesFor } = require('../../../modules/job/policies/job.rules');
// If you have other modules, import their define*RulesFor similarly

/**
 * Builds a CASL Ability instance for the given user
 * combining rules from all modules (job, user, candidate, etc).
 *
 * @param {Object} user - The logged-in user object
 * @returns {Ability} - CASL Ability instance
 */
function buildAbilityFor(user) {
  const { can, cannot, rules } = new AbilityBuilder(createMongoAbility);

  // Add rules from Job module
  defineJobRulesFor(user, can, cannot);

  // TODO: Add rules from other modules here, e.g.
  // defineUserRulesFor(user, can, cannot);
  // defineCandidateRulesFor(user, can, cannot);

  return new createMongoAbility(rules, {
    detectSubjectType: item => item.__type || item.constructor.name,
  });
}

module.exports = { buildAbilityFor };
