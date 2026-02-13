import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { buildBaselineSuggestionPayload } from '../scripts/reportDiagnosticsFixtures.js';
import {
  assertReadFailureDiagnosticContext,
  collectReportDiagnostics,
  findDiagnosticByCode,
} from './helpers/reportDiagnosticsTestUtils.js';

const execFileAsync = promisify(execFile);

test('suggest-baselines-check passes with no drift and emits summary diagnostic', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'suggest-baselines-check-'));
  const payloadPath = path.join(tempDirectory, 'baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/suggest-baselines-check.js');

  try {
    await writeFile(
      payloadPath,
      JSON.stringify(buildBaselineSuggestionPayload({ changed: false }), null, 2),
      'utf-8',
    );

    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        SIM_BASELINE_SUGGEST_PATH: payloadPath,
        REPORT_DIAGNOSTICS_JSON: '1',
      },
    });
    assert.match(stdout, /aggregateChangedMetrics=0/);
    assert.match(stdout, /"code":"baseline-suggestion-summary"/);
    assert.match(stdout, /"script":"simulate:baseline:check"/);
    assert.equal(stderr.trim(), '');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('suggest-baselines-check fails on drift and emits drift diagnostic', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'suggest-baselines-check-'));
  const payloadPath = path.join(tempDirectory, 'baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/suggest-baselines-check.js');

  try {
    await writeFile(
      payloadPath,
      JSON.stringify(buildBaselineSuggestionPayload({ changed: true }), null, 2),
      'utf-8',
    );

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            SIM_BASELINE_SUGGEST_PATH: payloadPath,
            REPORT_DIAGNOSTICS_JSON: '1',
          },
        }),
      (error) =>
        error.code === 1 &&
        error.stderr.includes('Baseline drift detected') &&
        error.stderr.includes('"code":"baseline-signature-drift"') &&
        error.stderr.includes('"script":"simulate:baseline:check"'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('suggest-baselines-check emits read-error diagnostic for unreadable cache path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'suggest-baselines-check-'));
  const scriptPath = path.resolve('scripts/suggest-baselines-check.js');

  try {
    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          env: {
            ...process.env,
            SIM_BASELINE_SUGGEST_PATH: tempDirectory,
            REPORT_DIAGNOSTICS_JSON: '1',
          },
        }),
      (error) => {
        assert.equal(error.code, 1);
        assert.ok(error.stderr.includes('Unable to read baseline suggestion cache payload'));
        const diagnostics = collectReportDiagnostics(error.stdout, error.stderr);
        const readErrorDiagnostic = findDiagnosticByCode(
          diagnostics,
          REPORT_DIAGNOSTIC_CODES.artifactReadError,
        );
        assert.equal(readErrorDiagnostic.script, 'simulate:baseline:check');
        assertReadFailureDiagnosticContext({
          diagnostic: readErrorDiagnostic,
          expectedPath: tempDirectory,
          expectedStatus: 'error',
          expectedErrorCode: 'EISDIR',
        });
        return true;
      },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
