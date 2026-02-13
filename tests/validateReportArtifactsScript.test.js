import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REPORT_DIAGNOSTIC_CODES } from '../scripts/reportDiagnostics.js';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { REPORT_ARTIFACT_TARGETS } from '../src/game/reportArtifactsValidation.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './helpers/reportDiagnosticsScriptTestUtils.js';
import {
  REPORT_READ_FAILURE_SCENARIOS,
  assertNodeDiagnosticsScriptReadFailureScenario,
} from './helpers/reportReadFailureMatrixTestUtils.js';
import {
  createInvalidJsonArtifact,
  createUnreadableArtifactPath,
} from './helpers/reportReadFailureFixtures.js';

test('validate-report-artifacts script emits validation report for invalid/missing artifacts', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-report-artifacts-script-'));
  const outputPath = path.join('reports', 'report-artifacts-validation.json');
  const markdownOutputPath = path.join('reports', 'report-artifacts-validation.md');
  const scriptPath = path.resolve('scripts/validate-report-artifacts.js');

  try {
    await createInvalidJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'reports/scenario-tuning-dashboard.json',
    });

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      cwd: tempDirectory,
      env: {
        REPORTS_VALIDATE_OUTPUT_PATH: outputPath,
        REPORTS_VALIDATE_OUTPUT_MD_PATH: markdownOutputPath,
      },
      assertion: (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /\[invalid-json\] reports\/scenario-tuning-dashboard\.json/i);
        assert.match(
          error.stderr,
          /report artifact at "reports\/scenario-tuning-dashboard\.json" is not valid JSON/i,
        );
        assert.match(
          error.stderr,
          new RegExp(`code=${REPORT_DIAGNOSTIC_CODES.artifactInvalidJson}`, 'i'),
        );
        assert.match(
          error.stderr,
          new RegExp(`code=${REPORT_DIAGNOSTIC_CODES.artifactReadError}`, 'i'),
        );
        return true;
      },
    });

    const summary = JSON.parse(
      await readFile(path.join(tempDirectory, outputPath), 'utf-8'),
    );
    assert.equal(summary.meta.kind, REPORT_KINDS.reportArtifactsValidation);
    assert.equal(summary.totalChecked, REPORT_ARTIFACT_TARGETS.length);
    assert.equal(summary.overallPassed, false);
    assert.equal(summary.statusCounts['invalid-json'], 1);
    assert.ok(summary.failureCount >= 1);

    const dashboardRow = summary.results.find(
      (row) => row.path === 'reports/scenario-tuning-dashboard.json',
    );
    assert.equal(dashboardRow.status, 'invalid-json');
    assert.equal(
      dashboardRow.message,
      'report artifact at "reports/scenario-tuning-dashboard.json" is not valid JSON.',
    );
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-artifacts emits JSON diagnostics when enabled', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-report-artifacts-script-'));
  const scriptPath = path.resolve('scripts/validate-report-artifacts.js');
  const runId = 'validate-report-artifacts-invalid-json-run';

  try {
    await createInvalidJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'reports/scenario-tuning-dashboard.json',
    });

    await assertNodeDiagnosticsScriptReadFailureScenario({
      scriptPath,
      cwd: tempDirectory,
      scenario: REPORT_READ_FAILURE_SCENARIOS.invalidJson,
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      expectedScript: 'reports:validate',
      expectedRunId: runId,
      expectedPath: 'reports/scenario-tuning-dashboard.json',
      assertDiagnostic: ({ diagnostic: invalidJsonDiagnostic }) => {
        assert.equal(invalidJsonDiagnostic.level, 'error');
        assert.equal(typeof invalidJsonDiagnostic.context?.reason, 'string');
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-artifacts emits read-error diagnostic for unreadable artifact path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-report-artifacts-script-'));
  const scriptPath = path.resolve('scripts/validate-report-artifacts.js');
  const runId = 'validate-report-artifacts-read-error-run';

  try {
    await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'reports/scenario-tuning-dashboard.json',
    });

    await assertNodeDiagnosticsScriptReadFailureScenario({
      scriptPath,
      cwd: tempDirectory,
      scenario: REPORT_READ_FAILURE_SCENARIOS.unreadable,
      env: {
        REPORT_DIAGNOSTICS_JSON: '1',
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
      expectedScript: 'reports:validate',
      expectedRunId: runId,
      expectedPath: 'reports/scenario-tuning-dashboard.json',
      assertDiagnostic: ({ error }) => {
        assert.equal(error.code, 1);
        assert.match(
          error.stderr,
          /Unable to read report artifact at "reports\/scenario-tuning-dashboard\.json"/i,
        );
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('validate-report-artifacts script passes after generating all target artifacts', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-report-artifacts-script-'));
  const validateArtifactsScriptPath = path.resolve('scripts/validate-report-artifacts.js');
  const validateTuningScriptPath = path.resolve('scripts/validate-scenario-tuning.js');
  const reportTuningScriptPath = path.resolve('scripts/report-scenario-tuning.js');
  const reportTrendScriptPath = path.resolve('scripts/report-scenario-tuning-trend.js');
  const suggestTuningBaselineScriptPath = path.resolve('scripts/suggest-scenario-tuning-baseline.js');
  const suggestBaselineScriptPath = path.resolve('scripts/suggest-baselines.js');

  try {
    await runNodeDiagnosticsScript(validateTuningScriptPath, { cwd: tempDirectory });
    await runNodeDiagnosticsScript(reportTuningScriptPath, { cwd: tempDirectory });
    await runNodeDiagnosticsScript(reportTrendScriptPath, { cwd: tempDirectory });
    await runNodeDiagnosticsScript(suggestTuningBaselineScriptPath, { cwd: tempDirectory });
    await runNodeDiagnosticsScript(suggestBaselineScriptPath, {
      cwd: tempDirectory,
      env: {
        SIM_BASELINE_SUGGEST_RUNS: '2',
      },
    });

    const { stdout } = await runNodeDiagnosticsScript(validateArtifactsScriptPath, {
      cwd: tempDirectory,
    });
    assert.match(stdout, /failed=0/i);

    const summary = JSON.parse(
      await readFile(
        path.join(tempDirectory, 'reports', 'report-artifacts-validation.json'),
        'utf-8',
      ),
    );
    assert.equal(summary.meta.kind, REPORT_KINDS.reportArtifactsValidation);
    assert.equal(summary.totalChecked, REPORT_ARTIFACT_TARGETS.length);
    assert.equal(summary.overallPassed, true);
    assert.equal(summary.failureCount, 0);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
