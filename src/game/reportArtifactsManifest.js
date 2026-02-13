import { REPORT_KINDS } from './reportPayloadMeta.js';

export const REPORT_ARTIFACT_TARGETS = Object.freeze([
  { path: 'reports/scenario-tuning-validation.json', kind: REPORT_KINDS.scenarioTuningValidation },
  { path: 'reports/scenario-tuning-dashboard.json', kind: REPORT_KINDS.scenarioTuningDashboard },
  { path: 'reports/scenario-tuning-trend.json', kind: REPORT_KINDS.scenarioTuningTrend },
  {
    path: 'reports/scenario-tuning-baseline-suggestions.json',
    kind: REPORT_KINDS.scenarioTuningBaselineSuggestions,
  },
  { path: 'reports/baseline-suggestions.json', kind: REPORT_KINDS.baselineSuggestions },
]);

const REPORT_ARTIFACT_TARGET_KIND_SET = new Set(REPORT_ARTIFACT_TARGETS.map((target) => target.kind));

const REPORT_ARTIFACT_REGEN_COMMANDS = Object.freeze({
  'reports/scenario-tuning-validation.json': 'npm run simulate:validate:tuning',
  'reports/scenario-tuning-dashboard.json': 'npm run simulate:report:tuning',
  'reports/scenario-tuning-trend.json': 'npm run simulate:report:tuning:trend',
  'reports/scenario-tuning-baseline-suggestions.json': 'npm run simulate:suggest:tuning-baseline',
  'reports/baseline-suggestions.json': 'npm run simulate:baseline:suggest',
});

export function isKnownReportArtifactTargetKind(kind) {
  return REPORT_ARTIFACT_TARGET_KIND_SET.has(kind);
}

export function getReportArtifactRegenerationCommand(path) {
  return REPORT_ARTIFACT_REGEN_COMMANDS[path] ?? 'npm run verify';
}
