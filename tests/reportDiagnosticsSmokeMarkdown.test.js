import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDiagnosticsSmokeSummary } from '../scripts/reportDiagnosticsSmokeSummary.js';
import {
  buildDiagnosticsSmokeMarkdown,
  isValidDiagnosticsSmokeMarkdown,
} from '../scripts/reportDiagnosticsSmokeMarkdown.js';
import {
  buildReportDiagnostic,
  REPORT_DIAGNOSTIC_CODES,
} from '../scripts/reportDiagnostics.js';

function buildSummaryFixture() {
  const runId = 'smoke-markdown-test-run';
  const generatedAt = '2026-02-13T12:00:00.000Z';
  const reportDiagnostic = buildReportDiagnostic({
    generatedAt,
    script: 'reports:validate',
    runId,
    level: 'error',
    code: REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
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
        observedCodes: [REPORT_DIAGNOSTIC_CODES.artifactInvalidJson],
        ok: false,
        errors: [
          `Missing expected diagnostic code "${REPORT_DIAGNOSTIC_CODES.artifactReadError}".`,
        ],
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
  assert.match(markdown, new RegExp(`\\| ${REPORT_DIAGNOSTIC_CODES.artifactInvalidJson} \\| 1 \\|`));
  assert.match(markdown, /## Failures/);
  assert.match(
    markdown,
    new RegExp(
      `Missing expected diagnostic code "${REPORT_DIAGNOSTIC_CODES.artifactReadError}"\\.`,
    ),
  );
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

test('isValidDiagnosticsSmokeMarkdown validates expected markdown sections', () => {
  const summary = buildSummaryFixture();
  const markdown = buildDiagnosticsSmokeMarkdown(summary);
  assert.equal(isValidDiagnosticsSmokeMarkdown(markdown, summary), true);
  assert.equal(
    isValidDiagnosticsSmokeMarkdown(
      markdown.replace('## Diagnostic counts by script', '## Script count section removed'),
      summary,
    ),
    false,
  );
});
