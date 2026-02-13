import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildDiagnosticsSmokeSummary } from '../scripts/reportDiagnosticsSmokeSummary.js';
import { buildDiagnosticsSmokeMarkdown } from '../scripts/reportDiagnosticsSmokeMarkdown.js';
import { buildReportDiagnostic, REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { collectReportDiagnostics } from './helpers/reportDiagnosticsTestUtils.js';

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
  const markdownPath = path.join(tempDirectory, 'report-diagnostics-smoke.md');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
    await writeFile(markdownPath, buildDiagnosticsSmokeMarkdown(summary), 'utf-8');

    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
      },
    });

    assert.match(stdout, /Diagnostics smoke report is valid and passing/);
    assert.equal(stderr.trim(), '');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits summary diagnostic when json diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'report-diagnostics-smoke.md');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');
  const runId = 'validate-smoke-json-success-run';

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
    await writeFile(markdownPath, buildDiagnosticsSmokeMarkdown(summary), 'utf-8');

    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
    });

    const diagnostics = collectReportDiagnostics(stdout, stderr);
    const summaryDiagnostic = diagnostics.find(
      (diagnostic) => diagnostic.code === REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeValidationSummary,
    );
    assert.ok(summaryDiagnostic);
    assert.equal(summaryDiagnostic.script, 'diagnostics:smoke:validate');
    assert.equal(summaryDiagnostic.runId, runId);
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

test('validate-report-diagnostics-smoke fails when markdown artifact is missing', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
            REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
          },
        }),
      (error) =>
        error.code === 1 &&
        error.stderr.includes('Missing diagnostics smoke markdown report'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails when markdown artifact is invalid', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'report-diagnostics-smoke.md');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
    await writeFile(markdownPath, '# Broken markdown payload', 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
            REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
          },
        }),
      (error) =>
        error.code === 1 &&
        error.stderr.includes('failed validation against summary payload'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke can skip markdown validation when disabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const markdownPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.md');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    const summary = createPassingSummary();
    await writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf-8');

    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
        REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH: markdownPath,
        REPORT_DIAGNOSTICS_SMOKE_VALIDATE_MARKDOWN: '0',
      },
    });

    assert.match(stdout, /Diagnostics smoke report is valid and passing/);
    assert.equal(stderr.trim(), '');
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

test('validate-report-diagnostics-smoke emits failed-scenarios diagnostic when json diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');
  const runId = 'validate-smoke-json-failure-run';

  try {
    await writeFile(reportPath, JSON.stringify(createFailingSummary(), null, 2), 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
            REPORT_DIAGNOSTICS_JSON: '1',
            REPORT_DIAGNOSTICS_RUN_ID: runId,
          },
        }),
      (error) => {
        const diagnostics = collectReportDiagnostics(error.stdout, error.stderr);
        const failedDiagnostic = diagnostics.find(
          (diagnostic) =>
            diagnostic.code === REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeFailedScenarios,
        );
        assert.ok(failedDiagnostic);
        assert.equal(failedDiagnostic.script, 'diagnostics:smoke:validate');
        assert.equal(failedDiagnostic.runId, runId);
        return true;
      },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails when report file is missing', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.json');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
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
        error.stderr.includes('Missing diagnostics smoke report'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails on invalid json report payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    await writeFile(reportPath, '{"broken": ', 'utf-8');
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
        error.stderr.includes('is not valid JSON'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails on unreadable path errors', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportDirectoryPath = path.join(tempDirectory, 'report-diagnostics-smoke-as-directory');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    await mkdir(reportDirectoryPath, { recursive: true });
    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportDirectoryPath,
          },
        }),
      (error) =>
        error.code === 1 &&
        error.stderr.includes('Unable to read diagnostics smoke report'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
