import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';

const execFileAsync = promisify(execFile);

function buildBaselineSuggestionPayload({ changed }) {
  const suggestedAggregateBounds = {
    frontier: {
      alivePopulationMean: { min: 8, max: 8.2 },
    },
  };
  const suggestedSnapshotSignatures = {
    'frontier:standard': 'bbbb2222',
  };
  const currentAggregateBounds = {
    frontier: {
      alivePopulationMean: changed ? { min: 7.9, max: 8.1 } : { min: 8, max: 8.2 },
    },
  };
  const currentSnapshotSignatures = {
    'frontier:standard': changed ? 'aaaa1111' : 'bbbb2222',
  };

  return withReportMeta(REPORT_KINDS.baselineSuggestions, {
    driftRuns: 8,
    currentAggregateBounds,
    suggestedAggregateBounds,
    currentSnapshotSignatures,
    suggestedSnapshotSignatures,
    aggregateDelta: {
      frontier: {
        alivePopulationMean: {
          changed,
          minDelta: changed ? 0.1 : 0,
          maxDelta: changed ? 0.1 : 0,
        },
      },
    },
    snapshotDelta: [
      {
        key: 'frontier:standard',
        changed,
        from: currentSnapshotSignatures['frontier:standard'],
        to: suggestedSnapshotSignatures['frontier:standard'],
      },
    ],
    snippets: {
      regressionBaseline: `export const AGGREGATE_BASELINE_BOUNDS = ${JSON.stringify(suggestedAggregateBounds)};\n`,
      regressionSnapshots: `export const EXPECTED_SUMMARY_SIGNATURES = ${JSON.stringify(suggestedSnapshotSignatures)};\n`,
    },
  });
}

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
        error.stderr.includes('"code":"baseline-signature-drift"'),
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
