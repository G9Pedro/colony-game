import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPORT_KINDS, withReportMeta } from '../src/game/reportPayloadValidators.js';
import {
  isValidReportDiagnosticPayload,
  parseReportDiagnosticsFromText,
  REPORT_DIAGNOSTIC_CODES,
} from './reportDiagnostics.js';

const execFileAsync = promisify(execFile);

const outputPath =
  process.env.REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH ?? 'reports/report-diagnostics-smoke.json';
const runId = process.env.REPORT_DIAGNOSTICS_RUN_ID ?? `report-diagnostics-smoke-${Date.now()}`;

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

function collectDiagnostics(stdout = '', stderr = '') {
  return [...parseReportDiagnosticsFromText(stdout), ...parseReportDiagnosticsFromText(stderr)];
}

function countBy(entries, getKey) {
  return entries.reduce((acc, entry) => {
    const key = getKey(entry);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

async function runNodeScript(scriptPath, { cwd, env }) {
  try {
    const result = await execFileAsync(process.execPath, [scriptPath], {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
    });
    return {
      exitCode: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      exitCode: Number.isInteger(error?.code) ? error.code : 1,
      stdout: error?.stdout ?? '',
      stderr: error?.stderr ?? '',
    };
  }
}

function evaluateScenarioDiagnostics({
  name,
  expectedScript,
  expectedExitCode,
  expectedCodes,
  runResult,
  runIdValue,
}) {
  const diagnostics = collectDiagnostics(runResult.stdout, runResult.stderr);
  const errors = [];

  if (runResult.exitCode !== expectedExitCode) {
    errors.push(`Expected exit code ${expectedExitCode} but got ${runResult.exitCode}.`);
  }

  if (diagnostics.length === 0) {
    errors.push('No diagnostics emitted.');
  }

  const observedCodes = new Set();
  for (const diagnostic of diagnostics) {
    observedCodes.add(diagnostic.code);
    if (!isValidReportDiagnosticPayload(diagnostic)) {
      errors.push('Encountered invalid diagnostic payload.');
    }
    if (diagnostic.script !== expectedScript) {
      errors.push(
        `Unexpected diagnostic script "${diagnostic.script}" (expected "${expectedScript}").`,
      );
    }
    if (diagnostic.runId !== runIdValue) {
      errors.push(`Unexpected diagnostic runId "${diagnostic.runId}" (expected "${runIdValue}").`);
    }
  }

  for (const code of expectedCodes) {
    if (!observedCodes.has(code)) {
      errors.push(`Missing expected diagnostic code "${code}".`);
    }
  }

  return {
    name,
    expectedScript,
    expectedExitCode,
    actualExitCode: runResult.exitCode,
    diagnostics,
    observedCodes: [...observedCodes].sort((a, b) => a.localeCompare(b)),
    ok: errors.length === 0,
    errors,
  };
}

async function main() {
  const baseDirectory = await mkdtemp(path.join(tmpdir(), 'report-diagnostics-smoke-'));
  try {
    const trendDir = path.join(baseDirectory, 'trend');
    const artifactsDir = path.join(baseDirectory, 'artifacts');
    const baselineChecksDir = path.join(baseDirectory, 'baseline-checks');
    await mkdir(trendDir, { recursive: true });
    await mkdir(path.join(artifactsDir, 'reports'), { recursive: true });
    await mkdir(baselineChecksDir, { recursive: true });

    const trendScriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');
    const validateArtifactsScriptPath = path.resolve('scripts/validate-report-artifacts.js');
    const checkTuningBaselineScriptPath = path.resolve('scripts/check-scenario-tuning-baseline.js');
    const checkBaselineScriptPath = path.resolve('scripts/suggest-baselines-check.js');

    const tuningBaselinePath = path.join(
      baselineChecksDir,
      'scenario-tuning-baseline-suggestions.json',
    );
    await writeFile(
      tuningBaselinePath,
      JSON.stringify(buildScenarioTuningIntensityOnlyDriftPayload(), null, 2),
      'utf-8',
    );

    const baselineSuggestionPath = path.join(baselineChecksDir, 'baseline-suggestions.json');
    await writeFile(
      baselineSuggestionPath,
      JSON.stringify(buildBaselineSuggestionPayload({ changed: true }), null, 2),
      'utf-8',
    );

    await writeFile(
      path.join(artifactsDir, 'reports', 'scenario-tuning-dashboard.json'),
      '{"broken": ',
      'utf-8',
    );

    const commonEnv = {
      REPORT_DIAGNOSTICS_JSON: '1',
      REPORT_DIAGNOSTICS_RUN_ID: runId,
    };

    const scenarios = [
      {
        name: 'trend-missing-baseline',
        expectedScript: 'simulate:report:tuning:trend',
        expectedExitCode: 0,
        expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactMissing],
        run: () =>
          runNodeScript(trendScriptPath, {
            cwd: trendDir,
            env: {
              ...commonEnv,
              SIM_SCENARIO_TUNING_TREND_PATH: path.join(trendDir, 'scenario-tuning-trend.json'),
              SIM_SCENARIO_TUNING_TREND_MD_PATH: path.join(trendDir, 'scenario-tuning-trend.md'),
              SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: path.join(
                trendDir,
                'missing-baseline.json',
              ),
            },
          }),
      },
      {
        name: 'validate-report-artifacts-failure',
        expectedScript: 'reports:validate',
        expectedExitCode: 1,
        expectedCodes: [
          REPORT_DIAGNOSTIC_CODES.artifactInvalidJson,
          REPORT_DIAGNOSTIC_CODES.artifactReadError,
        ],
        run: () =>
          runNodeScript(validateArtifactsScriptPath, {
            cwd: artifactsDir,
            env: commonEnv,
          }),
      },
      {
        name: 'scenario-tuning-baseline-check-intensity-warning',
        expectedScript: 'simulate:check:tuning-baseline',
        expectedExitCode: 0,
        expectedCodes: [
          REPORT_DIAGNOSTIC_CODES.scenarioTuningBaselineSummary,
          REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
          REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityEnforcementTip,
        ],
        run: () =>
          runNodeScript(checkTuningBaselineScriptPath, {
            cwd: baselineChecksDir,
            env: {
              ...commonEnv,
              SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: tuningBaselinePath,
            },
          }),
      },
      {
        name: 'baseline-check-drift-failure',
        expectedScript: 'simulate:baseline:check',
        expectedExitCode: 1,
        expectedCodes: [
          REPORT_DIAGNOSTIC_CODES.baselineSuggestionSummary,
          REPORT_DIAGNOSTIC_CODES.baselineSignatureDrift,
        ],
        run: () =>
          runNodeScript(checkBaselineScriptPath, {
            cwd: baselineChecksDir,
            env: {
              ...commonEnv,
              SIM_BASELINE_SUGGEST_PATH: baselineSuggestionPath,
            },
          }),
      },
    ];

    const scenarioResults = [];
    for (const scenario of scenarios) {
      const runResult = await scenario.run();
      scenarioResults.push(
        evaluateScenarioDiagnostics({
          name: scenario.name,
          expectedScript: scenario.expectedScript,
          expectedExitCode: scenario.expectedExitCode,
          expectedCodes: scenario.expectedCodes,
          runResult,
          runIdValue: runId,
        }),
      );
    }

    const allDiagnostics = scenarioResults.flatMap((result) => result.diagnostics);
    const failedScenarios = scenarioResults.filter((result) => !result.ok);
    const summary = {
      generatedAt: new Date().toISOString(),
      runId,
      scenarioCount: scenarioResults.length,
      passedScenarioCount: scenarioResults.length - failedScenarios.length,
      failedScenarioCount: failedScenarios.length,
      diagnosticsCount: allDiagnostics.length,
      diagnosticsByCode: countBy(allDiagnostics, (entry) => entry.code),
      diagnosticsByLevel: countBy(allDiagnostics, (entry) => entry.level),
      diagnosticsByScript: countBy(allDiagnostics, (entry) => entry.script ?? 'null'),
      scenarios: scenarioResults.map((result) => ({
        name: result.name,
        expectedScript: result.expectedScript,
        expectedExitCode: result.expectedExitCode,
        actualExitCode: result.actualExitCode,
        diagnosticsCount: result.diagnostics.length,
        observedCodes: result.observedCodes,
        ok: result.ok,
        errors: result.errors,
      })),
    };

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(summary, null, 2), 'utf-8');

    console.log(
      `Diagnostics smoke summary: scenarios=${summary.scenarioCount}, failed=${summary.failedScenarioCount}, diagnostics=${summary.diagnosticsCount}`,
    );
    console.log(`Diagnostics smoke report written to: ${outputPath}`);

    if (failedScenarios.length > 0) {
      failedScenarios.forEach((scenario) => {
        scenario.errors.forEach((error) => {
          console.error(`[diagnostics-smoke] ${scenario.name}: ${error}`);
        });
      });
      process.exit(1);
    }
  } finally {
    await rm(baseDirectory, { recursive: true, force: true });
  }
}

await main();
