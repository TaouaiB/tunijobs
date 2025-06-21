const { buildAbilityFor } = require('../../core/auth/abilities/ability.factory');

describe('CASL Ability Factory - buildAbilityFor', () => {
  it('should allow admin to manage all', () => {
    const adminUser = { id: 'admin123', role: 'admin' };
    const ability = buildAbilityFor(adminUser);

    expect(ability.can('manage', 'all')).toBe(true);
  });

  it('should allow company to create a job', () => {
    const companyUser = { id: 'comp456', role: 'company' };
    const ability = buildAbilityFor(companyUser);

    expect(ability.can('create', 'Job')).toBe(true);
  });

  it('should not allow candidate to delete a job', () => {
    const candidateUser = { id: 'cand789', role: 'candidate' };
    const ability = buildAbilityFor(candidateUser);

    expect(ability.can('delete', 'Job')).toBe(false);
  });
});
