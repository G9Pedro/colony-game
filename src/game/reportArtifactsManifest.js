import { REPORT_KINDS } from './reportPayloadMeta.js';

const REPORT_ARTIFACT_TARGET_DEFINITIONS = Object.freeze([
  {
    path: 'reports/scenario-tuning-validation.json',
    kind: REPORT_KINDS.scenarioTuningValidation,
    regenerationCommand: 'npm run simulate:validate:tuning',
  },
  {
    path: 'reports/scenario-tuning-dashboard.json',
    kind: REPORT_KINDS.scenarioTuningDashboard,
    regenerationCommand: 'npm run simulate:report:tuning',
  },
  {
    path: 'reports/scenario-tuning-trend.json',
    kind: REPORT_KINDS.scenarioTuningTrend,
    regenerationCommand: 'npm run simulate:report:tuning:trend',
  },
  {
    path: 'reports/scenario-tuning-baseline-suggestions.json',
    kind: REPORT_KINDS.scenarioTuningBaselineSuggestions,
    regenerationCommand: 'npm run simulate:suggest:tuning-baseline',
  },
  {
    path: 'reports/baseline-suggestions.json',
    kind: REPORT_KINDS.baselineSuggestions,
    regenerationCommand: 'npm run simulate:baseline:suggest',
  },
]);

export const REPORT_ARTIFACT_TARGETS = Object.freeze(
  REPORT_ARTIFACT_TARGET_DEFINITIONS.map(({ path, kind }) => Object.freeze({ path, kind })),
);

const REPORT_ARTIFACT_TARGET_KIND_SET = new Set(REPORT_ARTIFACT_TARGETS.map((target) => target.kind));
const REPORT_ARTIFACT_TARGET_PATH_SET = new Set(REPORT_ARTIFACT_TARGETS.map((target) => target.path));
const REPORT_ARTIFACT_TARGET_DEFINITION_BY_PATH = new Map(
  REPORT_ARTIFACT_TARGET_DEFINITIONS.map((target) => [target.path, Object.freeze({ ...target })]),
);
export const REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH = Object.freeze(
  [...REPORT_ARTIFACT_TARGETS].sort((left, right) => left.path.localeCompare(right.path)),
);

export function isKnownReportArtifactTargetKind(kind) {
  return REPORT_ARTIFACT_TARGET_KIND_SET.has(kind);
}

export function isKnownReportArtifactTargetPath(path) {
  return REPORT_ARTIFACT_TARGET_PATH_SET.has(path);
}

export function isValidReportArtifactTarget(path, kind) {
  return REPORT_ARTIFACT_TARGET_DEFINITION_BY_PATH.get(path)?.kind === kind;
}

export function hasExactReportArtifactTargets(results = undefined) {
  if (!Array.isArray(results) || results.length !== REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH.length) {
    return false;
  }
  for (let index = 0; index < REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH.length; index += 1) {
    const result = results[index];
    const expectedTarget = REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH[index];
    if (
      result?.path !== expectedTarget.path ||
      result?.kind !== expectedTarget.kind
    ) {
      return false;
    }
  }
  return true;
}

export function getReportArtifactRegenerationCommand(path) {
  return REPORT_ARTIFACT_TARGET_DEFINITION_BY_PATH.get(path)?.regenerationCommand ?? 'npm run verify';
}
