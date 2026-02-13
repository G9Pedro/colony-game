import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { buildDiagnosticsSmokeSummary } from '../../scripts/reportDiagnosticsSmokeSummary.js';
import { buildDiagnosticsSmokeMarkdown } from '../../scripts/reportDiagnosticsSmokeMarkdown.js';
import { buildReportDiagnostic } from '../../scripts/reportDiagnostics.js';

export const VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH = path.resolve(
  'scripts/validate-report-diagnostics-smoke.js',
);

export function createPassingSummary() {
  return buildDiagnosticsSmokeSummary({
    runId: 'validate-smoke-script-run',
    generatedAt: '2026-02-13T12:00:00.000Z',
    scenarioResults: [],
  });
}

export function createFailingSummary() {
  const runId = 'validate-smoke-script-failing-run';
  const generatedAt = '2026-02-13T12:00:00.000Z';
  const diagnostic = buildReportDiagnostic({
    generatedAt,
    script: 'simulate:baseline:check',
    runId,
    level: 'error',
    code: 'baseline-signature-drift',
    message: 'Baseline drift detected.',
    context: { changedSnapshotCount: 1 },
  });

  return buildDiagnosticsSmokeSummary({
    runId,
    generatedAt,
    scenarioResults: [
      {
        name: 'baseline-check-drift-failure',
        expectedScript: 'simulate:baseline:check',
        expectedExitCode: 1,
        actualExitCode: 1,
        diagnostics: [diagnostic],
        observedCodes: ['baseline-signature-drift'],
        ok: false,
        errors: ['Missing expected baseline summary diagnostic.'],
      },
    ],
  });
}

export async function writeValidSmokeArtifacts({ reportPath, markdownPath }) {
  const summary = createPassingSummary();
  await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
  await writeFile(markdownPath, buildDiagnosticsSmokeMarkdown(summary), 'utf-8');
  return summary;
}
