import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import {
  assertNodeDiagnosticsScriptOutputsReadFailureScenario,
} from './helpers/reportReadFailureMatrixTestUtils.js';
import { runNodeDiagnosticsScript } from './helpers/reportDiagnosticsScriptTestUtils.js';
import {
  createInvalidJsonArtifact,
  createJsonArtifact,
  createUnreadableArtifactPath,
} from './helpers/reportReadFailureFixtures.js';

async function runTrendScript({ tempDirectory, baselinePath, extraEnv = {} }) {
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
    env: {
      SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
      SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
      SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: baselinePath,
      ...extraEnv,
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
    assert.match(stdout, new RegExp(`code=${REPORT_DIAGNOSTIC_CODES.artifactMissing}`));
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script emits JSON diagnostics when enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-trend-script-'));
  const missingBaselinePath = path.join(tempDirectory, 'missing-baseline.json');
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  try {
    const { diagnostic } = await assertNodeDiagnosticsScriptOutputsReadFailureScenario({
      scriptPath,
      scenario: 'missing',
      expectedScript: 'simulate:report:tuning:trend',
      expectedLevel: 'info',
      expectedPath: missingBaselinePath,
      env: {
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: missingBaselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
      },
    });
    const payload = JSON.parse(await readFile(outputPath, 'utf-8'));

    assert.equal(payload.comparisonSource, 'signature-baseline');
    assert.equal(diagnostic.level, 'info');
    assert.equal(diagnostic.context?.baselinePath, missingBaselinePath);
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
    await createJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-dashboard.baseline.json',
      payload: baselinePayload,
    });

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
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  try {
    await createJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-dashboard.baseline.json',
      payload: withReportMeta(REPORT_KINDS.scenarioTuningDashboard, {
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
      }),
    });

    const { diagnostic, stderr } = await assertNodeDiagnosticsScriptOutputsReadFailureScenario({
      scriptPath,
      scenario: 'invalidPayload',
      expectedScript: 'simulate:report:tuning:trend',
      expectedLevel: 'warn',
      expectedPath: baselinePath,
      env: {
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: baselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
      },
    });
    const payload = JSON.parse(await readFile(outputPath, 'utf-8'));

    assert.equal(payload.comparisonSource, 'signature-baseline');
    assert.match(stderr, /simulate:capture:tuning-dashboard-baseline/);
    assert.match(
      stderr,
      new RegExp(`code=${REPORT_DIAGNOSTIC_CODES.artifactInvalidPayload}`),
    );
    assert.equal(diagnostic.level, 'warn');
    assert.equal(diagnostic.context?.baselinePath, baselinePath);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script warns and falls back when baseline payload is invalid JSON', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-trend-script-'));
  const baselinePath = path.join(tempDirectory, 'scenario-tuning-dashboard.baseline.json');
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  try {
    await createInvalidJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-dashboard.baseline.json',
    });

    const { diagnostic, stderr } = await assertNodeDiagnosticsScriptOutputsReadFailureScenario({
      scriptPath,
      scenario: 'invalidJson',
      expectedScript: 'simulate:report:tuning:trend',
      expectedLevel: 'warn',
      expectedPath: baselinePath,
      env: {
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: baselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
      },
    });
    const payload = JSON.parse(await readFile(outputPath, 'utf-8'));

    assert.equal(payload.comparisonSource, 'signature-baseline');
    assert.match(stderr, /invalid JSON/i);
    assert.match(stderr, /simulate:capture:tuning-dashboard-baseline/);
    assert.match(stderr, new RegExp(`code=${REPORT_DIAGNOSTIC_CODES.artifactInvalidJson}`));
    assert.equal(diagnostic.level, 'warn');
    assert.equal(diagnostic.context?.baselinePath, baselinePath);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('trend script warns and falls back when baseline path is unreadable as file', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'scenario-tuning-trend-script-'));
  const unreadableBaselinePath = path.join(
    tempDirectory,
    'scenario-tuning-dashboard.baseline.unreadable.json',
  );
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'scenario-tuning-dashboard.baseline.unreadable.json',
    });

    const { diagnostic, stderr } = await assertNodeDiagnosticsScriptOutputsReadFailureScenario({
      scriptPath,
      scenario: 'unreadable',
      expectedScript: 'simulate:report:tuning:trend',
      expectedLevel: 'warn',
      expectedPath: unreadableBaselinePath,
      env: {
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: unreadableBaselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
      },
    });
    const payload = JSON.parse(await readFile(outputPath, 'utf-8'));

    assert.equal(payload.comparisonSource, 'signature-baseline');
    assert.match(stderr, /falling back to signature baseline/i);
    assert.match(stderr, /simulate:capture:tuning-dashboard-baseline/);
    assert.match(stderr, new RegExp(`code=${REPORT_DIAGNOSTIC_CODES.artifactReadError}`));
    assert.equal(diagnostic.level, 'warn');
    assert.equal(diagnostic.context?.baselinePath, unreadableBaselinePath);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
