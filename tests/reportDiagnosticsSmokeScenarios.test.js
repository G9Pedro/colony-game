import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildDiagnosticsSmokeScenarios,
  setupDiagnosticsSmokeFixtureWorkspace,
} from '../scripts/reportDiagnosticsSmokeScenarios.js';

test('setupDiagnosticsSmokeFixtureWorkspace prepares expected fixture files', async () => {
  const baseDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostics-smoke-fixture-'));
  try {
    const workspace = await setupDiagnosticsSmokeFixtureWorkspace(baseDirectory);

    assert.ok(workspace.scriptPaths.trend.endsWith('scripts/report-scenario-tuning-trend.js'));
    assert.ok(workspace.scriptPaths.validateArtifacts.endsWith('scripts/validate-report-artifacts.js'));
    const invalidDashboardContents = await readFile(
      path.join(workspace.artifactsDir, 'reports', 'scenario-tuning-dashboard.json'),
      'utf-8',
    );
    assert.equal(invalidDashboardContents, '{"broken": ');

    const tuningBaselinePayload = JSON.parse(await readFile(workspace.tuningBaselinePath, 'utf-8'));
    assert.equal(tuningBaselinePayload.meta.kind, 'scenario-tuning-baseline-suggestions');

    const baselineSuggestionPayload = JSON.parse(
      await readFile(workspace.baselineSuggestionPath, 'utf-8'),
    );
    assert.equal(baselineSuggestionPayload.meta.kind, 'baseline-suggestions');
  } finally {
    await rm(baseDirectory, { recursive: true, force: true });
  }
});

test('buildDiagnosticsSmokeScenarios wires runId/env and expected contracts', async () => {
  const calls = [];
  const runNodeScript = async (scriptPath, runArgs) => {
    calls.push({ scriptPath, runArgs });
    return { exitCode: 0, stdout: '', stderr: '' };
  };
  const fixtureWorkspace = {
    trendDir: '/tmp/trend',
    artifactsDir: '/tmp/artifacts',
    baselineChecksDir: '/tmp/baseline-checks',
    scriptPaths: {
      trend: '/workspace/scripts/report-scenario-tuning-trend.js',
      validateArtifacts: '/workspace/scripts/validate-report-artifacts.js',
      checkTuningBaseline: '/workspace/scripts/check-scenario-tuning-baseline.js',
      checkBaseline: '/workspace/scripts/suggest-baselines-check.js',
    },
    tuningBaselinePath: '/tmp/baseline-checks/scenario-tuning-baseline-suggestions.json',
    baselineSuggestionPath: '/tmp/baseline-checks/baseline-suggestions.json',
  };

  const scenarios = buildDiagnosticsSmokeScenarios({
    runId: 'diagnostics-smoke-run-id',
    fixtureWorkspace,
    runNodeScript,
  });
  assert.equal(scenarios.length, 4);
  assert.equal(scenarios[0].name, 'trend-missing-baseline');
  assert.equal(scenarios[1].name, 'validate-report-artifacts-failure');
  assert.equal(scenarios[2].name, 'scenario-tuning-baseline-check-intensity-warning');
  assert.equal(scenarios[3].name, 'baseline-check-drift-failure');

  await scenarios[2].run();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].scriptPath, fixtureWorkspace.scriptPaths.checkTuningBaseline);
  assert.equal(calls[0].runArgs.cwd, fixtureWorkspace.baselineChecksDir);
  assert.equal(calls[0].runArgs.env.REPORT_DIAGNOSTICS_JSON, '1');
  assert.equal(calls[0].runArgs.env.REPORT_DIAGNOSTICS_RUN_ID, 'diagnostics-smoke-run-id');
  assert.equal(
    calls[0].runArgs.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH,
    fixtureWorkspace.tuningBaselinePath,
  );
});
