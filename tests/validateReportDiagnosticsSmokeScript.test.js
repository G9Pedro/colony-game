import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildDiagnosticsSmokeSummary } from '../scripts/reportDiagnosticsSmokeSummary.js';
import { buildReportDiagnostic } from '../scripts/reportDiagnostics.js';

const execFileAsync = promisify(execFile);

function createPassingSummary() {
  return buildDiagnosticsSmokeSummary({
    runId: 'validate-smoke-script-run',
    generatedAt: '2026-02-13T12:00:00.000Z',
    scenarioResults: [],
  });
}

function createFailingSummary() {
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

test('validate-report-diagnostics-smoke passes for valid and passing summary', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    await writeFile(reportPath, JSON.stringify(createPassingSummary(), null, 2), 'utf-8');

    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
      },
    });

    assert.match(stdout, /Diagnostics smoke report is valid and passing/);
    assert.equal(stderr.trim(), '');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails when report payload is invalid', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    await writeFile(reportPath, JSON.stringify({ type: 'bad-payload' }, null, 2), 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
          },
        }),
      (error) =>
        error.code === 1 &&
        error.stderr.includes('failed contract validation'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails when report indicates failed scenarios', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    await writeFile(reportPath, JSON.stringify(createFailingSummary(), null, 2), 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
          },
        }),
      (error) =>
        error.code === 1 &&
        error.stderr.includes('failed scenario'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
