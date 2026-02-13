import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';
import {
  REPORT_DIAGNOSTIC_CODES,
} from '../scripts/reportDiagnostics.js';
import { buildDiagnosticsSmokeSummary } from '../scripts/reportDiagnosticsSmokeSummary.js';
import {
  assertReportDiagnosticsContract,
  collectReportDiagnostics,
} from './helpers/reportDiagnosticsTestUtils.js';

const execFileAsync = promisify(execFile);
const RUN_ID = 'diagnostic-contract-fixture-run';

function buildScenarioTuningIntensityOnlyDriftPayload() {
  return withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, {
    overallPassed: false,
    changedCount: 0,
    intensityChangedCount: 1,
    strictIntensityRecommended: true,
    strictIntensityCommand:
      'SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1 npm run simulate:check:tuning-baseline',
    currentSignatures: { frontier: 'aaaa1111' },
    expectedSignatures: { frontier: 'aaaa1111' },
    currentTotalAbsDelta: { frontier: 12 },
    expectedTotalAbsDelta: { frontier: 0 },
    results: [
      {
        scenarioId: 'frontier',
        currentSignature: 'aaaa1111',
        expectedSignature: 'aaaa1111',
        changed: false,
        message: null,
      },
    ],
    intensityResults: [
      {
        scenarioId: 'frontier',
        currentTotalAbsDeltaPercent: 12,
        expectedTotalAbsDeltaPercent: 0,
        changed: true,
        message: 'expected 0 but got 12',
      },
    ],
    snippets: {
      scenarioTuningBaseline:
        'export const EXPECTED_SCENARIO_TUNING_SIGNATURES = {"frontier":"aaaa1111"};\n',
      scenarioTuningTotalAbsDeltaBaseline:
        'export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = {"frontier":12};\n',
    },
  });
}

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

test('trend script diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-trend-'));
  const outputPath = path.join(tempDirectory, 'scenario-tuning-trend.json');
  const markdownPath = path.join(tempDirectory, 'scenario-tuning-trend.md');
  const baselinePath = path.join(tempDirectory, 'missing-baseline.json');
  const scriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        SIM_SCENARIO_TUNING_TREND_PATH: outputPath,
        SIM_SCENARIO_TUNING_TREND_MD_PATH: markdownPath,
        SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: baselinePath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
    });

    assertReportDiagnosticsContract({
      diagnostics: collectReportDiagnostics(stdout, stderr),
      expectedScript: 'simulate:report:tuning:trend',
      expectedRunId: RUN_ID,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactMissing],
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-artifacts diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-artifacts-'));
  const scriptPath = path.resolve('scripts/validate-report-artifacts.js');

  try {
    await mkdir(path.join(tempDirectory, 'reports'), { recursive: true });
    await writeFile(
      path.join(tempDirectory, 'reports', 'scenario-tuning-dashboard.json'),
      '{"broken": ',
      'utf-8',
    );

    await assert.rejects(
      () =>
        execFileAsync(process.execPath, [scriptPath], {
          cwd: tempDirectory,
          env: {
            ...process.env,
            REPORT_DIAGNOSTICS_JSON: '1',
            REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
          },
        }),
      (error) => {
        assertReportDiagnosticsContract({
          diagnostics: collectReportDiagnostics(error.stdout, error.stderr),
          expectedScript: 'reports:validate',
          expectedRunId: RUN_ID,
          expectedCodes: [
            REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
            REPORT_DIAGNOSTIC_CODES.artifactReadError,
          ],
        });
        return true;
      },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('scenario tuning baseline check diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-tuning-check-'));
  const payloadPath = path.join(tempDirectory, 'scenario-tuning-baseline-suggestions.json');
  const scriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');

  try {
    await writeFile(
      payloadPath,
      JSON.stringify(buildScenarioTuningIntensityOnlyDriftPayload(), null, 2),
      'utf-8',
    );
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: payloadPath,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
      },
    });

    assertReportDiagnosticsContract({
      diagnostics: collectReportDiagnostics(stdout, stderr),
      expectedScript: 'simulate:check:tuning-baseline',
      expectedRunId: RUN_ID,
      expectedCodes: [
        REPORT_DIAGNOSTIC_CODES.scenarioTuningBaselineSummary,
        REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
        REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityEnforcementTip,
      ],
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('baseline suggestion check diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-baseline-check-'));
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
            REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
          },
        }),
      (error) => {
        assertReportDiagnosticsContract({
          diagnostics: collectReportDiagnostics(error.stdout, error.stderr),
          expectedScript: 'simulate:baseline:check',
          expectedRunId: RUN_ID,
          expectedCodes: [
            REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary,
            REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift,
          ],
        });
        return true;
      },
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('diagnostics smoke validation script diagnostics follow contract fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-contract-smoke-validate-'));
  const outputPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const scriptPath = path.resolve('scripts/validate-report-diagnostics-smoke.js');

  try {
    const summary = buildDiagnosticsSmokeSummary({
      runId: RUN_ID,
      generatedAt: '2026-02-13T12:00:00.000Z',
      scenarioResults: [],
    });
    await writeFile(outputPath, JSON.stringify(summary, null, 2), 'utf-8');

    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: RUN_ID,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: outputPath,
      },
    });
    assertReportDiagnosticsContract({
      diagnostics: collectReportDiagnostics(stdout, stderr),
      expectedScript: 'diagnostics:smoke:validate',
      expectedRunId: RUN_ID,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeValidationSummary],
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
