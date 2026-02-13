import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';

const execFileAsync = promisify(execFile);

async function runTrendScript({ tempDirectory, baselinePath }) {
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
    env: {
      ...process.env,
      SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
      SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
      SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: baselinePath,
    },
  });

  return {
    payload: JSON.parse(await readFile(outputPath, 'utf-8')),
    stdout,
    stderr,
  };
}

test('trend script falls back to signature baseline when dashboard baseline is missing', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-trend-script-'));
  const missingBaselinePath = path.join(tempDirectory, 'missing-baseline.json');

  try {
    const { payload, stdout } = await runTrendScript({
      tempDirectory,
      baselinePath: missingBaselinePath,
    });

    assert.equal(payload.meta.kind, REPORT_KINDS.scenarioTuningTrend);
    assert.equal(payload.comparisonSource, 'signature-baseline');
    assert.equal(payload.hasBaselineDashboard, false);
    assert.equal(payload.baselineScenarioCount, 0);
    assert.equal(typeof payload.statusCounts, 'object');
    assert.equal(
      payload.statusCounts.added +
        payload.statusCounts.changed +
        payload.statusCounts.removed +
        payload.statusCounts.unchanged,
      payload.scenarioCount,
    );
    assert.match(stdout, /statuses=added:\d+,changed:\d+,removed:\d+,unchanged:\d+/);
    assert.match(stdout, /code=artifact-missing/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script uses dashboard comparison when baseline dashboard payload exists', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-trend-script-'));
  const baselinePath = path.join(tempDirectory, 'scenario-tuning-dashboard.baseline.json');

  try {
    const baselinePayload = withReportMeta(REPORT_KINDS.scenarioTuningDashboard, {
      scenarioCount: 1,
      activeScenarioCount: 0,
      scenarios: [
        {
          id: 'frontier',
          name: 'Frontier',
          description: 'Baseline',
          signature: 'aaaa1111',
          resourceOutputDeltas: [],
          jobOutputDeltas: [],
          jobPriorityDeltas: [],
          resourceOutputSummary: {
            count: 0,
            meanAbsDeltaPercent: 0,
            maxAbsDeltaPercent: 0,
          },
          jobOutputSummary: {
            count: 0,
            meanAbsDeltaPercent: 0,
            maxAbsDeltaPercent: 0,
          },
          jobPrioritySummary: {
            count: 0,
            meanAbsDeltaPercent: 0,
            maxAbsDeltaPercent: 0,
          },
          totalAbsDeltaPercent: 0,
          isNeutral: true,
        },
      ],
      ranking: [{ rank: 1, scenarioId: 'frontier', totalAbsDeltaPercent: 0 }],
      signatureMap: { frontier: 'aaaa1111' },
    });
    await writeFile(baselinePath, JSON.stringify(baselinePayload, null, 2), 'utf-8');

    const { payload, stdout } = await runTrendScript({
      tempDirectory,
      baselinePath,
    });

    assert.equal(payload.meta.kind, REPORT_KINDS.scenarioTuningTrend);
    assert.equal(payload.comparisonSource, 'dashboard');
    assert.equal(payload.hasBaselineDashboard, true);
    assert.equal(payload.baselineScenarioCount, 1);
    assert.equal(typeof payload.statusCounts, 'object');
    assert.equal(
      payload.statusCounts.added +
        payload.statusCounts.changed +
        payload.statusCounts.removed +
        payload.statusCounts.unchanged,
      payload.scenarioCount,
    );
    assert.match(stdout, /statuses=added:\d+,changed:\d+,removed:\d+,unchanged:\d+/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script suggests baseline capture command when baseline payload is invalid', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-trend-script-'));
  const baselinePath = path.join(tempDirectory, 'scenario-tuning-dashboard.baseline.json');

  try {
    await writeFile(
      baselinePath,
      JSON.stringify(withReportMeta(REPORT_KINDS.scenarioTuningDashboard, {
        scenarioCount: 1,
        activeScenarioCount: 0,
        scenarios: [
          {
            id: 'zeta',
            name: 'Zeta',
            description: 'Out-of-order baseline row.',
            signature: 'bbbb2222',
            resourceOutputDeltas: [],
            jobOutputDeltas: [],
            jobPriorityDeltas: [],
            resourceOutputSummary: {
              count: 0,
              meanAbsDeltaPercent: 0,
              maxAbsDeltaPercent: 0,
            },
            jobOutputSummary: {
              count: 0,
              meanAbsDeltaPercent: 0,
              maxAbsDeltaPercent: 0,
            },
            jobPrioritySummary: {
              count: 0,
              meanAbsDeltaPercent: 0,
              maxAbsDeltaPercent: 0,
            },
            totalAbsDeltaPercent: 0,
            isNeutral: true,
          },
          {
            id: 'alpha',
            name: 'Alpha',
            description: 'Out-of-order baseline row.',
            signature: 'aaaa1111',
            resourceOutputDeltas: [],
            jobOutputDeltas: [],
            jobPriorityDeltas: [],
            resourceOutputSummary: {
              count: 0,
              meanAbsDeltaPercent: 0,
              maxAbsDeltaPercent: 0,
            },
            jobOutputSummary: {
              count: 0,
              meanAbsDeltaPercent: 0,
              maxAbsDeltaPercent: 0,
            },
            jobPrioritySummary: {
              count: 0,
              meanAbsDeltaPercent: 0,
              maxAbsDeltaPercent: 0,
            },
            totalAbsDeltaPercent: 0,
            isNeutral: true,
          },
        ],
        ranking: [
          { rank: 1, scenarioId: 'alpha', totalAbsDeltaPercent: 0 },
          { rank: 2, scenarioId: 'zeta', totalAbsDeltaPercent: 0 },
        ],
        signatureMap: { alpha: 'aaaa1111', zeta: 'bbbb2222' },
      }), null, 2),
      'utf-8',
    );

    const { payload, stderr } = await runTrendScript({
      tempDirectory,
      baselinePath,
    });

    assert.equal(payload.comparisonSource, 'signature-baseline');
    assert.match(stderr, /simulate:capture:tuning-dashboard-baseline/);
    assert.match(stderr, /code=artifact-invalid-payload/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script warns and falls back when baseline payload is invalid JSON', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-trend-script-'));
  const baselinePath = path.join(tempDirectory, 'scenario-tuning-dashboard.baseline.json');

  try {
    await writeFile(baselinePath, '{"broken": ', 'utf-8');

    const { payload, stderr } = await runTrendScript({
      tempDirectory,
      baselinePath,
    });

    assert.equal(payload.comparisonSource, 'signature-baseline');
    assert.match(stderr, /invalid JSON/i);
    assert.match(stderr, /simulate:capture:tuning-dashboard-baseline/);
    assert.match(stderr, /code=artifact-invalid-json/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script warns and falls back when baseline path is unreadable as file', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-trend-script-'));

  try {
    const { payload, stderr } = await runTrendScript({
      tempDirectory,
      baselinePath: tempDirectory,
    });

    assert.equal(payload.comparisonSource, 'signature-baseline');
    assert.match(stderr, /falling back to signature baseline/i);
    assert.match(stderr, /simulate:capture:tuning-dashboard-baseline/);
    assert.match(stderr, /code=artifact-read-error/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
