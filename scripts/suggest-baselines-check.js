import { getBaselineChangeSummary } from '../src/game/baselineSuggestion.js';
import {
  isValidBaselineSuggestionPayload,
  REPORT_KINDS,
} from '../src/game/reportPayloadValidators.js';
import { buildBaselineSuggestionPayloadFromSimulations } from './baselineSuggestionRuntime.js';
import { loadJsonPayloadOrCompute } from './jsonPayloadCache.js';
import {
  createScriptDiagnosticEmitter,
  REPORT_DIAGNOSTIC_CODES,
} from './reportDiagnostics.js';
import { buildValidatedReportPayload } from './reportPayloadOutput.js';
import {
  buildReadArtifactFailureContext,
  formatReadArtifactFailureMessage,
  getReadArtifactDiagnosticCode,
} from './reportPayloadInput.js';

const inputPath = process.env.SIM_BASELINE_SUGGEST_PATH ?? 'reports/baseline-suggestions.json';
const driftRuns = Number(process.env.SIM_BASELINE_SUGGEST_RUNS ?? 8);
const strategyProfileId = process.env.SIM_STRATEGY_PROFILE ?? 'baseline';
const DIAGNOSTIC_SCRIPT = 'simulate:baseline:check';
const emitDiagnostic = createScriptDiagnosticEmitter(DIAGNOSTIC_SCRIPT);

let source;
let payload;
try {
  ({ source, payload } = await loadJsonPayloadOrCompute({
    path: inputPath,
    recoverOnParseError: true,
    validatePayload: isValidBaselineSuggestionPayload,
    recoverOnInvalidPayload: true,
    computePayload: () =>
      buildValidatedReportPayload(
        REPORT_KINDS.baselineSuggestions,
        buildBaselineSuggestionPayloadFromSimulations({
          driftRuns,
          strategyProfileId,
        }),
        'baseline suggestion',
      ),
  }));
} catch (error) {
  const readFailure = error?.cacheReadFailure;
  if (readFailure) {
    const diagnosticCode =
      getReadArtifactDiagnosticCode(readFailure) ?? REPORT_DIAGNOSTIC_CODES.artifactReadError;
    emitDiagnostic({
      level: 'error',
      code: diagnosticCode,
      message: 'Baseline suggestion cache payload read failed.',
      context: buildReadArtifactFailureContext(readFailure),
    });
    console.error(
      formatReadArtifactFailureMessage({
        readResult: readFailure,
        artifactLabel: 'baseline suggestion cache payload',
      }),
    );
    process.exit(1);
  }

  emitDiagnostic({
    level: 'error',
    code: REPORT_DIAGNOSTIC_CODES.artifactReadError,
    message: 'Baseline suggestion check failed before summary evaluation.',
    context: {
      path: inputPath,
      reason: error?.message ?? 'unknown error',
      errorCode: error?.code ?? null,
    },
  });
  console.error(
    `Unable to prepare baseline suggestion payload at "${inputPath}": ${error?.message ?? 'unknown error'}`,
  );
  process.exit(1);
}
const summary = getBaselineChangeSummary(payload);

console.log(
  `Baseline change summary: aggregateChangedMetrics=${summary.aggregateChangedMetrics}, snapshotChangedKeys=${summary.snapshotChangedKeys}, source=${source}`,
);
emitDiagnostic({
  level: 'info',
  code: REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary,
  message: 'Baseline suggestion check summary.',
  context: {
    aggregateChangedMetrics: summary.aggregateChangedMetrics,
    snapshotChangedKeys: summary.snapshotChangedKeys,
    source,
  },
});

if (summary.hasChanges) {
  const changedSnapshots = (payload.snapshotDelta ?? []).filter((item) => item.changed);
  emitDiagnostic({
    level: 'error',
    code: REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift,
    message: 'Baseline drift detected.',
    context: {
      aggregateChangedMetrics: summary.aggregateChangedMetrics,
      snapshotChangedKeys: summary.snapshotChangedKeys,
      changedSnapshotKeys: changedSnapshots.map((item) => item.key),
      source,
    },
  });
  if (changedSnapshots.length > 0) {
    changedSnapshots.forEach((item) => {
      console.error(`- Snapshot ${item.key}: ${item.from ?? 'null'} -> ${item.to ?? 'null'}`);
    });
  }
  console.error('Suggested baseline snippets:');
  console.error(payload.snippets?.regressionBaseline ?? '(aggregate snippet unavailable)');
  console.error(payload.snippets?.regressionSnapshots ?? '(snapshot snippet unavailable)');
  console.error('Baseline drift detected. Re-baseline intentionally if this is expected.');
  process.exit(1);
}
