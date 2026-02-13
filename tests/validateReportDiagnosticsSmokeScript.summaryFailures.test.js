import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { collectReportDiagnostics } from './helpers/reportDiagnosticsTestUtils.js';
import {
  VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH,
  createFailingSummary,
} from './helpers/validateReportDiagnosticsSmokeTestUtils.js';

const execFileAsync = promisify(execFile);

test('validate-report-diagnostics-smoke fails when report payload is invalid', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');

  try {
    await writeFile(reportPath, JSON.stringify({ type: 'bad-payload' }, null, 2), 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
          },
        }),
      (error) => error.code === 1 && error.stderr.includes('failed contract validation'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails when report indicates failed scenarios', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');

  try {
    await writeFile(reportPath, JSON.stringify(createFailingSummary(), null, 2), 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
          },
        }),
      (error) => error.code === 1 && error.stderr.includes('failed scenario'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits failed-scenarios diagnostic when json diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const runId = 'validate-smoke-json-failure-run';

  try {
    await writeFile(reportPath, JSON.stringify(createFailingSummary(), null, 2), 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
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

  try {
    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
          },
        }),
      (error) => error.code === 1 && error.stderr.includes('Missing diagnostics smoke report'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits artifact-missing diagnostic for missing summary when diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'missing-report-diagnostics-smoke.json');
  const runId = 'validate-smoke-json-missing-summary-run';

  try {
    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
            REPORT_DIAGNOSTICS_JSON: '1',
            REPORT_DIAGNOSTICS_RUN_ID: runId,
          },
        }),
      (error) => {
        const diagnostics = collectReportDiagnostics(error.stdout, error.stderr);
        const missingDiagnostic = diagnostics.find(
          (diagnostic) => diagnostic.code === REPORT_DIAGNOSTIC_CODES.artifactMissing,
        );
        assert.ok(missingDiagnostic);
        assert.equal(missingDiagnostic.script, 'diagnostics:smoke:validate');
        assert.equal(missingDiagnostic.runId, runId);
        return true;
      },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails on invalid json report payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');

  try {
    await writeFile(reportPath, '{"broken": ', 'utf-8');
    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
          },
        }),
      (error) => error.code === 1 && error.stderr.includes('is not valid JSON'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke emits invalid-json diagnostic for invalid summary json when diagnostics are enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const runId = 'validate-smoke-json-invalid-summary-run';

  try {
    await writeFile(reportPath, '{"broken": ', 'utf-8');

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportPath,
            REPORT_DIAGNOSTICS_JSON: '1',
            REPORT_DIAGNOSTICS_RUN_ID: runId,
          },
        }),
      (error) => {
        const diagnostics = collectReportDiagnostics(error.stdout, error.stderr);
        const invalidJsonDiagnostic = diagnostics.find(
          (diagnostic) => diagnostic.code === REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
        );
        assert.ok(invalidJsonDiagnostic);
        assert.equal(invalidJsonDiagnostic.script, 'diagnostics:smoke:validate');
        assert.equal(invalidJsonDiagnostic.runId, runId);
        return true;
      },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-diagnostics-smoke fails on unreadable path errors', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-smoke-report-'));
  const reportDirectoryPath = path.join(tempDirectory, 'report-diagnostics-smoke-as-directory');

  try {
    await mkdir(reportDirectoryPath, { recursive: true });
    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: reportDirectoryPath,
          },
        }),
      (error) =>
        error.code === 1 && error.stderr.includes('Unable to read diagnostics smoke report'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
