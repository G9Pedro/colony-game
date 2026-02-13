import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDiagnosticsSmokeSummary,
  isValidDiagnosticsSmokeSummaryPayload,
} from '../scripts/reportDiagnosticsSmokeSummary.js';
import { buildReportDiagnostic } from '../scripts/reportDiagnostics.js';

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
      code: 'artifact-invalid-json',
      message: 'Invalid JSON payload.',
      context: { artifactPath: 'reports/scenario-tuning-dashboard.json' },
    }),
    buildReportDiagnostic({
      generatedAt,
      script: 'simulate:baseline:check',
      runId,
      level: 'error',
      code: 'baseline-signature-drift',
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
        observedCodes: ['artifact-invalid-json'],
        ok: true,
        errors: [],
      }),
      buildScenarioResult({
        name: 'baseline-check-drift-failure',
        expectedScript: 'simulate:baseline:check',
        expectedExitCode: 1,
        actualExitCode: 1,
        diagnostics: [diagnostics[1]],
        observedCodes: ['baseline-signature-drift'],
        ok: false,
        errors: ['Expected additional summary diagnostic code.'],
      }),
    ],
  });

  assert.equal(summary.scenarioCount, 2);
  assert.equal(summary.passedScenarioCount, 1);
  assert.equal(summary.failedScenarioCount, 1);
  assert.equal(summary.diagnosticsCount, 2);
  assert.equal(summary.diagnosticsByCode['artifact-invalid-json'], 1);
  assert.equal(summary.diagnosticsByCode['baseline-signature-drift'], 1);
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
    code: 'scenario-tuning-intensity-drift',
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
        observedCodes: ['scenario-tuning-intensity-drift'],
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
