import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDiagnosticsSmokeSummary } from '../scripts/reportDiagnosticsSmokeSummary.js';
import { buildDiagnosticsSmokeMarkdown } from '../scripts/reportDiagnosticsSmokeMarkdown.js';
import { buildReportDiagnostic } from '../scripts/reportDiagnostics.js';

function buildSummaryFixture() {
  const runId = 'smoke-markdown-test-run';
  const generatedAt = '2026-02-13T12:00:00.000Z';
  const reportDiagnostic = buildReportDiagnostic({
    generatedAt,
    script: 'reports:validate',
    runId,
    level: 'error',
    code: 'artifact-invalid-json',
    message: 'Invalid JSON payload.',
    context: { artifactPath: 'reports/scenario-tuning-dashboard.json' },
  });

  return buildDiagnosticsSmokeSummary({
    runId,
    generatedAt,
    scenarioResults: [
      {
        name: 'validate-report-artifacts-failure',
        expectedScript: 'reports:validate',
        expectedExitCode: 1,
        actualExitCode: 1,
        diagnostics: [reportDiagnostic],
        observedCodes: ['artifact-invalid-json'],
        ok: false,
        errors: ['Missing expected diagnostic code "artifact-read-error".'],
      },
    ],
  });
}

test('buildDiagnosticsSmokeMarkdown renders summary counters and scenario table', () => {
  const markdown = buildDiagnosticsSmokeMarkdown(buildSummaryFixture());
  assert.match(markdown, /^# Report Diagnostics Smoke Summary/m);
  assert.match(markdown, /- run id: smoke-markdown-test-run/);
  assert.match(markdown, /\| validate-report-artifacts-failure \| reports:validate \| 1 \| 1 \| 1 \| fail \|/);
  assert.match(markdown, /## Diagnostic counts by code/);
  assert.match(markdown, /\| artifact-invalid-json \| 1 \|/);
  assert.match(markdown, /## Failures/);
  assert.match(markdown, /Missing expected diagnostic code "artifact-read-error"\./);
});

test('buildDiagnosticsSmokeMarkdown rejects invalid summary payloads', () => {
  assert.throws(
    () =>
      buildDiagnosticsSmokeMarkdown({
        type: 'bad',
      }),
    /invalid summary payload/i,
  );
});
