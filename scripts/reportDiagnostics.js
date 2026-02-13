export const REPORT_DIAGNOSTIC_LEVELS = Object.freeze(['info', 'warn', 'error']);

export const REPORT_DIAGNOSTIC_CODES = Object.freeze({
  artifactMissing: 'artifact-missing',
  artifactInvalidJson: 'artifact-invalid-json',
  artifactInvalidPayload: 'artifact-invalid-payload',
  artifactReadError: 'artifact-read-error',
  scenarioTuningBaselineSummary: 'scenario-tuning-baseline-summary',
  scenarioTuningSignatureDrift: 'scenario-tuning-signature-drift',
  scenarioTuningIntensityDrift: 'scenario-tuning-intensity-drift',
  scenarioTuningIntensityDriftStrict: 'scenario-tuning-intensity-drift-strict',
  scenarioTuningIntensityEnforcementTip: 'scenario-tuning-intensity-enforcement-tip',
  baselineSuggestionSummary: 'baseline-suggestion-summary',
  baselineSignatureDrift: 'baseline-signature-drift',
});

const REPORT_DIAGNOSTIC_CODE_SET = new Set(Object.values(REPORT_DIAGNOSTIC_CODES));

export function isJsonDiagnosticsEnabled() {
  return process.env.REPORT_DIAGNOSTICS_JSON === '1';
}

export function isKnownReportDiagnosticCode(code) {
  return typeof code === 'string' && REPORT_DIAGNOSTIC_CODE_SET.has(code);
}

export function buildReportDiagnostic({
  level = 'info',
  code,
  message,
  context = null,
}) {
  if (!REPORT_DIAGNOSTIC_LEVELS.includes(level)) {
    throw new TypeError(`Invalid report diagnostic level "${level}".`);
  }
  if (!isKnownReportDiagnosticCode(code)) {
    throw new Error(`Unknown report diagnostic code "${code}".`);
  }
  if (typeof message !== 'string' || message.length === 0) {
    throw new TypeError('Report diagnostic message must be a non-empty string.');
  }
  if (context !== null && (typeof context !== 'object' || Array.isArray(context))) {
    throw new TypeError('Report diagnostic context must be an object or null.');
  }

  return {
    type: 'report-diagnostic',
    level,
    code,
    message,
    context,
  };
}

export function emitJsonDiagnostic({
  level = 'info',
  code,
  message,
  context = null,
}) {
  const payload = buildReportDiagnostic({
    level,
    code,
    message,
    context,
  });

  if (!isJsonDiagnosticsEnabled()) {
    return;
  }

  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}
