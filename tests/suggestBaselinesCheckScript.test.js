import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { buildBaselineSuggestionPayload } from '../scripts/reportDiagnosticsFixtures.js';
import {
  assertOutputDiagnosticsContract,
  assertOutputHasDiagnostic,
} from './helpers/reportDiagnosticsTestUtils.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './helpers/reportDiagnosticsScriptTestUtils.js';
import { assertNodeDiagnosticsScriptReadFailureScenario } from './helpers/reportReadFailureMatrixTestUtils.js';
import {
  createJsonArtifact,
  createUnreadableArtifactPath,
} from './helpers/reportReadFailureFixtures.js';

test('suggest-baselines-check passes with no drift and emits summary diagnostic', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'suggest-baselines-check-'));
  const payloadPath = path.join(tempDirectory, 'baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/suggest-baselines-check.js');
  const runId = 'suggest-baseline-check-pass-run';

  try {
    await createJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'baseline-suggestions.json',
      payload: buildBaselineSuggestionPayload({ changed: false }),
    });

    const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
      env: {
        SIM_BASELINE_SUGGEST_PATH: payloadPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
    });
    assert.match(stdout, /aggregateChangedMetrics=0/);
    assertOutputDiagnosticsContract({
      stdout,
      stderr,
      expectedScript: 'simulate:baseline:check',
      expectedRunId: runId,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary],
    });
    const summaryDiagnostic = assertOutputHasDiagnostic({
      stdout,
      stderr,
      diagnosticCode: REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary,
      expectedScript: 'simulate:baseline:check',
      expectedRunId: runId,
      expectedLevel: 'info',
    });
    assert.equal(summaryDiagnostic.context?.aggregateChangedMetrics, 0);
    assert.equal(summaryDiagnostic.context?.snapshotChangedKeys, 0);
    assert.equal(summaryDiagnostic.context?.source, 'file');
    assert.equal(stderr.trim(), '');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('suggest-baselines-check fails on drift and emits drift diagnostic', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'suggest-baselines-check-'));
  const payloadPath = path.join(tempDirectory, 'baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/suggest-baselines-check.js');
  const runId = 'suggest-baseline-check-drift-run';

  try {
    await createJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'baseline-suggestions.json',
      payload: buildBaselineSuggestionPayload({ changed: true }),
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      env: {
        SIM_BASELINE_SUGGEST_PATH: payloadPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      assertion: (error) => {
        assert.equal(error.code, 1);
        assert.ok(error.stderr.includes('Baseline drift detected'));
        assertOutputDiagnosticsContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedScript: 'simulate:baseline:check',
          expectedRunId: runId,
          expectedCodes: [
            REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary,
            REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift,
          ],
        });
        const driftDiagnostic = assertOutputHasDiagnostic({
          stdout: error.stdout,
          stderr: error.stderr,
          diagnosticCode: REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift,
          expectedScript: 'simulate:baseline:check',
          expectedRunId: runId,
          expectedLevel: 'error',
        });
        assert.equal(driftDiagnostic.context?.aggregateChangedMetrics, 1);
        assert.equal(driftDiagnostic.context?.snapshotChangedKeys, 1);
        assert.equal(
          Array.isArray(driftDiagnostic.context?.changedSnapshotKeys),
          true,
        );
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('suggest-baselines-check emits read-error diagnostic for unreadable cache path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'suggest-baselines-check-'));
  const unreadableCachePath = path.join(tempDirectory, 'baseline-suggestions.unreadable.json');
  const scriptPath = path.resolve('scripts/suggest-baselines-check.js');
  const runId = 'suggest-baseline-check-read-error-run';

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'baseline-suggestions.unreadable.json',
    });

    await assertNodeDiagnosticsScriptReadFailureScenario({
      scriptPath,
      scenario: 'unreadable',
      env: {
        SIM_BASELINE_SUGGEST_PATH: unreadableCachePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      expectedScript: 'simulate:baseline:check',
      expectedRunId: runId,
      expectedPath: unreadableCachePath,
      assertDiagnostic: ({ error }) => {
        assert.equal(error.code, 1);
        assert.ok(error.stderr.includes('Unable to read baseline suggestion cache payload'));
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
