import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDiagnosticsSmokeSummary,
  isValidDiagnosticsSmokeSummaryPayload,
} from '../scripts/reportDiagnosticsSmokeSummary.js';
import {
  buildReportDiagnostic,
  REPORT_DIAGNOSTIC_CODES,
} from '../scripts/reportDiagnostics.js';

function buildScenarioResult({
  name,
  expectedScript,
  expectedExitCode,
  actualExitCode,
  diagnostics,
  observedCodes,
  ok,
  errors,
}) {
  return {
    name,
    expectedScript,
    expectedExitCode,
    actualExitCode,
    diagnostics,
    observedCodes,
    ok,
    errors,
  };
}

test('buildDiagnosticsSmokeSummary computes aggregate counts and scenario rows', () => {
  const runId = 'smoke-summary-run';
  const generatedAt = '2026-02-13T12:00:00.000Z';
  const diagnostics = [
    buildReportDiagnostic({
      generatedAt,
      script: 'reports:validate',
      runId,
      level: 'error',
      code: REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
      message: 'Invalid JSON payload.',
      context: { artifactPath: 'reports/scenario-tuning-dashboard.json' },
    }),
    buildReportDiagnostic({
      generatedAt,
      script: 'simulate:baseline:check',
      runId,
      level: 'error',
      code: REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift,
      message: 'Baseline drift detected.',
      context: { changedSnapshotCount: 1 },
    }),
  ];

  const summary = buildDiagnosticsSmokeSummary({
    runId,
    generatedAt,
    scenarioResults: [
      buildScenarioResult({
        name: 'validate-report-artifacts-failure',
        expectedScript: 'reports:validate',
        expectedExitCode: 1,
        actualExitCode: 1,
        diagnostics: [diagnostics[0]],
        observedCodes: [REPORT_DIAGNOSTIC_CODES.artifactInvalidJson],
        ok: true,
        errors: [],
      }),
      buildScenarioResult({
        name: 'baseline-check-drift-failure',
        expectedScript: 'simulate:baseline:check',
        expectedExitCode: 1,
        actualExitCode: 1,
        diagnostics: [diagnostics[1]],
        observedCodes: [REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift],
        ok: false,
        errors: ['Expected additional summary diagnostic code.'],
      }),
    ],
  });

  assert.equal(summary.scenarioCount, 2);
  assert.equal(summary.passedScenarioCount, 1);
  assert.equal(summary.failedScenarioCount, 1);
  assert.equal(summary.diagnosticsCount, 2);
  assert.equal(summary.diagnosticsByCode[REPORT_DIAGNOSTIC_CODES.artifactInvalidJson], 1);
  assert.equal(summary.diagnosticsByCode[REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift], 1);
  assert.equal(summary.diagnosticsByLevel.error, 2);
  assert.equal(summary.diagnosticsByScript['reports:validate'], 1);
  assert.equal(summary.diagnosticsByScript['simulate:baseline:check'], 1);
  assert.equal(summary.scenarios.length, 2);
  assert.equal(summary.scenarios[0].name, 'validate-report-artifacts-failure');
  assert.equal(summary.scenarios[1].ok, false);
  assert.equal(isValidDiagnosticsSmokeSummaryPayload(summary), true);
});

test('isValidDiagnosticsSmokeSummaryPayload rejects inconsistent counts', () => {
  const runId = 'smoke-summary-invalid-run';
  const generatedAt = '2026-02-13T12:00:00.000Z';
  const diagnostic = buildReportDiagnostic({
    generatedAt,
    script: 'simulate:check:tuning-baseline',
    runId,
    level: 'warn',
    code: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
    message: 'Intensity drift detected.',
    context: { changedScenarios: ['frontier'] },
  });

  const summary = buildDiagnosticsSmokeSummary({
    runId,
    generatedAt,
    scenarioResults: [
      buildScenarioResult({
        name: 'scenario-tuning-baseline-check-intensity-warning',
        expectedScript: 'simulate:check:tuning-baseline',
        expectedExitCode: 0,
        actualExitCode: 0,
        diagnostics: [diagnostic],
        observedCodes: [REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift],
        ok: true,
        errors: [],
      }),
    ],
  });

  assert.equal(isValidDiagnosticsSmokeSummaryPayload(summary), true);
  const mutated = {
    ...summary,
    diagnosticsCount: summary.diagnosticsCount + 1,
  };
  assert.equal(isValidDiagnosticsSmokeSummaryPayload(mutated), false);
});

test('isValidDiagnosticsSmokeSummaryPayload rejects unknown top-level fields', () => {
  const summary = buildDiagnosticsSmokeSummary({
    runId: 'smoke-summary-extra-field-run',
    generatedAt: '2026-02-13T12:00:00.000Z',
    scenarioResults: [],
  });

  assert.equal(isValidDiagnosticsSmokeSummaryPayload(summary), true);
  assert.equal(
    isValidDiagnosticsSmokeSummaryPayload({
      ...summary,
      unknownField: true,
    }),
    false,
  );
});

test('isValidDiagnosticsSmokeSummaryPayload rejects unknown diagnostics levels', () => {
  const summary = buildDiagnosticsSmokeSummary({
    runId: 'smoke-summary-invalid-level-run',
    generatedAt: '2026-02-13T12:00:00.000Z',
    scenarioResults: [],
  });
  const mutated = {
    ...summary,
    diagnosticsByLevel: {
      debug: 1,
    },
    diagnosticsCount: 1,
  };
  assert.equal(isValidDiagnosticsSmokeSummaryPayload(mutated), false);
});

test('isValidDiagnosticsSmokeSummaryPayload rejects unknown scenario observed codes', () => {
  const summary = buildDiagnosticsSmokeSummary({
    runId: 'smoke-summary-invalid-observed-code-run',
    generatedAt: '2026-02-13T12:00:00.000Z',
    scenarioResults: [],
  });
  const mutated = {
    ...summary,
    scenarioCount: 1,
    passedScenarioCount: 1,
    scenarios: [
      {
        name: 'fake-scenario',
        expectedScript: 'diagnostics:smoke',
        expectedExitCode: 0,
        actualExitCode: 0,
        diagnosticsCount: 0,
        observedCodes: ['non-existent-diagnostic-code'],
        ok: true,
        errors: [],
      },
    ],
  };
  assert.equal(isValidDiagnosticsSmokeSummaryPayload(mutated), false);
});
