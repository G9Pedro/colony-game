import {
  REPORT_KINDS,
  REPORT_SCHEMA_VERSIONS,
  withReportMeta,
} from './reportPayloadMeta.js';
import { isValidBaselineSuggestionPayload } from './reportPayloadValidatorsBaseline.js';
import {
  isValidScenarioTuningDashboardPayload,
  isValidScenarioTuningSuggestionPayload,
  isValidScenarioTuningTrendPayload,
  isValidScenarioTuningValidationPayload,
} from './reportPayloadValidatorsScenarioTuning.js';
import { isValidReportArtifactsValidationPayload } from './reportPayloadValidatorsReportArtifacts.js';

export {
  REPORT_KINDS,
  REPORT_SCHEMA_VERSIONS,
  withReportMeta,
  isValidBaselineSuggestionPayload,
  isValidScenarioTuningSuggestionPayload,
  isValidScenarioTuningValidationPayload,
  isValidScenarioTuningDashboardPayload,
  isValidScenarioTuningTrendPayload,
  isValidReportArtifactsValidationPayload,
};

export const REPORT_VALIDATORS = {
  [REPORT_KINDS.baselineSuggestions]: isValidBaselineSuggestionPayload,
  [REPORT_KINDS.scenarioTuningBaselineSuggestions]: isValidScenarioTuningSuggestionPayload,
  [REPORT_KINDS.scenarioTuningValidation]: isValidScenarioTuningValidationPayload,
  [REPORT_KINDS.scenarioTuningDashboard]: isValidScenarioTuningDashboardPayload,
  [REPORT_KINDS.scenarioTuningTrend]: isValidScenarioTuningTrendPayload,
  [REPORT_KINDS.reportArtifactsValidation]: isValidReportArtifactsValidationPayload,
};

export function isKnownReportKind(kind) {
  return Boolean(REPORT_VALIDATORS[kind]);
}

export function validateReportPayloadByKind(kind, payload) {
  const validator = REPORT_VALIDATORS[kind];
  if (!validator) {
    return {
      ok: false,
      reason: `Unknown report kind "${kind}".`,
    };
  }
  const ok = Boolean(validator(payload));
  return {
    ok,
    reason: ok ? null : `Payload failed validation for kind "${kind}".`,
  };
}
