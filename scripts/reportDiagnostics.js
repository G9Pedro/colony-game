export const REPORT_DIAGNOSTIC_LEVELS = Object.freeze(['info', 'warn', 'error']);
export const REPORT_DIAGNOSTICS_SCHEMA_VERSION = 1;
export const REPORT_DIAGNOSTIC_TYPE = 'report-diagnostic';
export const REPORT_DIAGNOSTIC_FIELDS = Object.freeze([
  'type',
  'schemaVersion',
  'generatedAt',
  'script',
  'runId',
  'level',
  'code',
  'message',
  'context',
]);

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
  diagnosticsSmokeRunSummary: 'diagnostics-smoke-run-summary',
  diagnosticsSmokeValidationSummary: 'diagnostics-smoke-validation-summary',
  diagnosticsSmokeFailedScenarios: 'diagnostics-smoke-failed-scenarios',
});

export const REPORT_DIAGNOSTIC_CODE_VALUES = Object.freeze(
  Object.values(REPORT_DIAGNOSTIC_CODES),
);

const REPORT_DIAGNOSTIC_CODE_SET = new Set(REPORT_DIAGNOSTIC_CODE_VALUES);
const REPORT_DIAGNOSTIC_FIELD_SET = new Set(REPORT_DIAGNOSTIC_FIELDS);

export function isJsonDiagnosticsEnabled() {
  return process.env.REPORT_DIAGNOSTICS_JSON === '1';
}

export function isKnownReportDiagnosticCode(code) {
  return typeof code === 'string' && REPORT_DIAGNOSTIC_CODE_SET.has(code);
}

export function getSortedReportDiagnosticCodes() {
  return [...REPORT_DIAGNOSTIC_CODE_VALUES].sort((left, right) => left.localeCompare(right));
}

export function buildReportDiagnostic({
  level = 'info',
  code,
  message,
  context = null,
  script = null,
  runId = null,
  generatedAt = new Date().toISOString(),
  schemaVersion = REPORT_DIAGNOSTICS_SCHEMA_VERSION,
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
  if (
    script !== null &&
    (typeof script !== 'string' || script.trim().length === 0)
  ) {
    throw new TypeError('Report diagnostic script must be a non-empty string or null.');
  }
  if (
    runId !== null &&
    (typeof runId !== 'string' || runId.trim().length === 0)
  ) {
    throw new TypeError('Report diagnostic runId must be a non-empty string or null.');
  }
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new TypeError('Report diagnostic schemaVersion must be an integer >= 1.');
  }
  if (
    typeof generatedAt !== 'string' ||
    generatedAt.length === 0 ||
    Number.isNaN(Date.parse(generatedAt))
  ) {
    throw new TypeError('Report diagnostic generatedAt must be a valid ISO timestamp string.');
  }
  if (new Date(generatedAt).toISOString() !== generatedAt) {
    throw new TypeError('Report diagnostic generatedAt must be a canonical ISO timestamp string.');
  }

  return {
    type: REPORT_DIAGNOSTIC_TYPE,
    schemaVersion,
    generatedAt,
    script,
    runId,
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
  script = null,
  runId = undefined,
}) {
  const effectiveRunId =
    runId === undefined ? process.env.REPORT_DIAGNOSTICS_RUN_ID ?? null : runId;
  const payload = buildReportDiagnostic({
    level,
    code,
    message,
    context,
    script,
    runId: effectiveRunId,
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

export function createScriptDiagnosticEmitter(script, defaultRunId = undefined) {
  if (typeof script !== 'string' || script.trim().length === 0) {
    throw new TypeError('Script diagnostic emitter requires a non-empty script identifier.');
  }

  return function emitScriptDiagnostic({
    level = 'info',
    code,
    message,
    context = null,
    runId = defaultRunId,
  }) {
    emitJsonDiagnostic({
      level,
      code,
      message,
      context,
      script,
      runId,
    });
  };
}

export function isValidReportDiagnosticPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }
  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length !== REPORT_DIAGNOSTIC_FIELDS.length) {
    return false;
  }
  if (payloadKeys.some((key) => !REPORT_DIAGNOSTIC_FIELD_SET.has(key))) {
    return false;
  }
  if (REPORT_DIAGNOSTIC_FIELDS.some((key) => !Object.prototype.hasOwnProperty.call(payload, key))) {
    return false;
  }
  try {
    buildReportDiagnostic({
      level: payload.level,
      code: payload.code,
      message: payload.message,
      context: payload.context ?? null,
      script: payload.script ?? null,
      runId: payload.runId ?? null,
      generatedAt: payload.generatedAt,
      schemaVersion: payload.schemaVersion,
    });
  } catch {
    return false;
  }
  return payload.type === REPORT_DIAGNOSTIC_TYPE;
}

export function parseReportDiagnosticsFromText(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{'))
    .map((line) => {
      try {
        const payload = JSON.parse(line);
        if (payload?.type !== REPORT_DIAGNOSTIC_TYPE) {
          return null;
        }
        return isValidReportDiagnosticPayload(payload) ? payload : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
