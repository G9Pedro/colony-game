import { RESOURCE_KEYS } from './resources.js';
import { SCENARIO_DEFINITIONS } from './scenarios.js';

const JOB_KEYS = [
  'farmer',
  'lumberjack',
  'miner',
  'artisan',
  'scholar',
  'builder',
  'medic',
  'laborer',
];

const RECOMMENDED_RANGE_BY_TYPE = {
  resource: { min: 0.85, max: 1.2 },
  job: { min: 0.85, max: 1.2 },
  jobPriority: { min: 0.75, max: 1.35 },
};

const HARD_LIMITS_BY_TYPE = {
  resource: { min: 0.25, max: 3 },
  job: { min: 0.25, max: 3 },
  jobPriority: { min: 0.25, max: 3 },
};

function createIssue({ severity, scenarioId, path, message }) {
  return {
    severity,
    scenarioId,
    path,
    message,
  };
}

function validateNumericMultiplier({
  value,
  scenarioId,
  path,
  issues,
  type,
}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push(
      createIssue({
        severity: 'error',
        scenarioId,
        path,
        message: 'Multiplier must be a finite number.',
      }),
    );
    return;
  }

  const hardLimits = HARD_LIMITS_BY_TYPE[type];
  if (value < hardLimits.min || value > hardLimits.max) {
    issues.push(
      createIssue({
        severity: 'error',
        scenarioId,
        path,
        message: `Multiplier ${value} is outside hard limits ${hardLimits.min}..${hardLimits.max}.`,
      }),
    );
    return;
  }

  const recommendedRange = RECOMMENDED_RANGE_BY_TYPE[type];
  if (value < recommendedRange.min || value > recommendedRange.max) {
    issues.push(
      createIssue({
        severity: 'warn',
        scenarioId,
        path,
        message: `Multiplier ${value} is outside recommended range ${recommendedRange.min}..${recommendedRange.max}.`,
      }),
    );
  }
}

function validateMultiplierMap({
  scenarioId,
  map,
  allowedKeys,
  pathPrefix,
  type,
  issues,
}) {
  if (!map || typeof map !== 'object') {
    issues.push(
      createIssue({
        severity: 'error',
        scenarioId,
        path: pathPrefix,
        message: 'Expected an object map.',
      }),
    );
    return;
  }

  for (const key of Object.keys(map)) {
    if (!allowedKeys.includes(key)) {
      issues.push(
        createIssue({
          severity: 'error',
          scenarioId,
          path: `${pathPrefix}.${key}`,
          message: `Unknown key "${key}". Allowed: ${allowedKeys.join(', ')}`,
        }),
      );
      continue;
    }

    validateNumericMultiplier({
      value: map[key],
      scenarioId,
      path: `${pathPrefix}.${key}`,
      issues,
      type,
    });
  }
}

export function validateScenarioTuningDefinitions(scenarios = SCENARIO_DEFINITIONS) {
  const issues = [];

  for (const [scenarioId, scenario] of Object.entries(scenarios)) {
    validateMultiplierMap({
      scenarioId,
      map: scenario.productionMultipliers?.resource ?? {},
      allowedKeys: RESOURCE_KEYS,
      pathPrefix: 'productionMultipliers.resource',
      type: 'resource',
      issues,
    });

    validateMultiplierMap({
      scenarioId,
      map: scenario.productionMultipliers?.job ?? {},
      allowedKeys: JOB_KEYS,
      pathPrefix: 'productionMultipliers.job',
      type: 'job',
      issues,
    });

    validateMultiplierMap({
      scenarioId,
      map: scenario.jobPriorityMultipliers ?? {},
      allowedKeys: JOB_KEYS,
      pathPrefix: 'jobPriorityMultipliers',
      type: 'jobPriority',
      issues,
    });
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warn');

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    issueCount: issues.length,
    checkedScenarioCount: Object.keys(scenarios).length,
  };
}
