export const BALANCE_PROFILE_DEFINITIONS = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Default production-ready balancing.',
    needDecayMultiplier: 1,
    starvationHealthDamageMultiplier: 1,
    restHealthDamageMultiplier: 1,
    moralePenaltyMultiplier: 1,
    objectiveRewardMultiplier: 1,
  },
  forgiving: {
    id: 'forgiving',
    name: 'Forgiving',
    description: 'Smoother onboarding with gentler colony pressure.',
    needDecayMultiplier: 0.85,
    starvationHealthDamageMultiplier: 0.8,
    restHealthDamageMultiplier: 0.85,
    moralePenaltyMultiplier: 0.85,
    objectiveRewardMultiplier: 1.15,
  },
  brutal: {
    id: 'brutal',
    name: 'Brutal',
    description: 'High-pressure survival tuning for expert players.',
    needDecayMultiplier: 1.2,
    starvationHealthDamageMultiplier: 1.3,
    restHealthDamageMultiplier: 1.2,
    moralePenaltyMultiplier: 1.25,
    objectiveRewardMultiplier: 0.9,
  },
};

export function getBalanceProfileDefinition(profileId) {
  return BALANCE_PROFILE_DEFINITIONS[profileId] ?? BALANCE_PROFILE_DEFINITIONS.standard;
}
