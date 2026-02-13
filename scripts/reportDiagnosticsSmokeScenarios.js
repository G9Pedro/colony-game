import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from './reportDiagnostics.js';
import {
  buildBaselineSuggestionPayload,
  buildScenarioTuningIntensityOnlyDriftPayload,
} from './reportDiagnosticsFixtures.js';

export async function setupDiagnosticsSmokeFixtureWorkspace(baseDirectory) {
  const trendDir = path.join(baseDirectory, 'trend');
  const artifactsDir = path.join(baseDirectory, 'artifacts');
  const baselineChecksDir = path.join(baseDirectory, 'baseline-checks');
  await mkdir(trendDir, { recursive: true });
  await mkdir(path.join(artifactsDir, 'reports'), { recursive: true });
  await mkdir(baselineChecksDir, { recursive: true });

  const scriptPaths = {
    trend: path.resolve('scripts/report-scenario-tuning-trend.js'),
    validateArtifacts: path.resolve('scripts/validate-report-artifacts.js'),
    checkTuningBaseline: path.resolve('scripts/check-scenario-tuning-baseline.js'),
    checkBaseline: path.resolve('scripts/suggest-baselines-check.js'),
  };

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

  return {
    trendDir,
    artifactsDir,
    baselineChecksDir,
    scriptPaths,
    tuningBaselinePath,
    baselineSuggestionPath,
  };
}

export function buildDiagnosticsSmokeScenarios({ runId, fixtureWorkspace, runNodeScript }) {
  const commonEnv = {
    REPORT_DIAGNOSTICS_JSON: '1',
    REPORT_DIAGNOSTICS_RUN_ID: runId,
  };

  return [
    {
      name: 'trend-missing-baseline',
      expectedScript: 'simulate:report:tuning:trend',
      expectedExitCode: 0,
      expectedCodes: [REPORT_DIAGNOSTIC_CODES.artifactMissing],
      run: () =>
        runNodeScript(fixtureWorkspace.scriptPaths.trend, {
          cwd: fixtureWorkspace.trendDir,
          env: {
            ...commonEnv,
            SIM_SCENARIO_TUNING_TREND_PATH: path.join(
              fixtureWorkspace.trendDir,
              'scenario-tuning-trend.json',
            ),
            SIM_SCENARIO_TUNING_TREND_MD_PATH: path.join(
              fixtureWorkspace.trendDir,
              'scenario-tuning-trend.md',
            ),
            SIM_SCENARIO_TUNING_TREND_BASELINE_PATH: path.join(
              fixtureWorkspace.trendDir,
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
        runNodeScript(fixtureWorkspace.scriptPaths.validateArtifacts, {
          cwd: fixtureWorkspace.artifactsDir,
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
        runNodeScript(fixtureWorkspace.scriptPaths.checkTuningBaseline, {
          cwd: fixtureWorkspace.baselineChecksDir,
          env: {
            ...commonEnv,
            SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH: fixtureWorkspace.tuningBaselinePath,
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
        runNodeScript(fixtureWorkspace.scriptPaths.checkBaseline, {
          cwd: fixtureWorkspace.baselineChecksDir,
          env: {
            ...commonEnv,
            SIM_BASELINE_SUGGEST_PATH: fixtureWorkspace.baselineSuggestionPath,
          },
        }),
    },
  ];
}
