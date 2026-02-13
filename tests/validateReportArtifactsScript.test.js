import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { REPORT_ARTIFACT_TARGETS } from '../src/game/reportArtifactsValidation.js';
import { findDiagnosticByCodeFromOutput } from './helpers/reportDiagnosticsTestUtils.js';

const execFileAsync = promisify(execFile);

async function runNodeScript(scriptPath, { cwd, env = {} }) {
  return execFileAsync(process.execPath, [scriptPath], {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
  });
}

test('validate-report-artifacts script emits validation report for invalid/missing artifacts', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'validate-report-artifacts-script-'));
  const outputPath = path.join('reports', 'report-artifacts-validation.json');
  const markdownOutputPath = path.join('reports', 'report-artifacts-validation.md');
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
            REPORTS_VALIDATE_OUTPUT_PATH: outputPath,
            REPORTS_VALIDATE_OUTPUT_MD_PATH: markdownOutputPath,
          },
        }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /\[invalid-json\] reports\/scenario-tuning-dashboard\.json/i);
        assert.match(
          error.stderr,
          /report artifact at "reports\/scenario-tuning-dashboard\.json" is not valid JSON/i,
        );
        assert.match(error.stderr, /code=artifact-invalid-json/i);
        assert.match(error.stderr, /code=artifact-read-error/i);
        return true;
      },
    );

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
          },
        }),
      (error) => {
        const invalidJsonDiagnostic = findDiagnosticByCodeFromOutput(
          { stdout: error.stdout, stderr: error.stderr },
          'artifact-invalid-json',
        );
        assert.equal(invalidJsonDiagnostic.level, 'error');
        assert.equal(invalidJsonDiagnostic.script, 'reports:validate');
        assert.equal(
          invalidJsonDiagnostic.context?.path,
          'reports/scenario-tuning-dashboard.json',
        );
        assert.equal(invalidJsonDiagnostic.context?.status, 'invalid-json');
        assert.equal(invalidJsonDiagnostic.context?.errorCode, null);
        assert.equal(typeof invalidJsonDiagnostic.context?.reason, 'string');
        return true;
      },
    );
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
    await runNodeScript(validateTuningScriptPath, { cwd: tempDirectory });
    await runNodeScript(reportTuningScriptPath, { cwd: tempDirectory });
    await runNodeScript(reportTrendScriptPath, { cwd: tempDirectory });
    await runNodeScript(suggestTuningBaselineScriptPath, { cwd: tempDirectory });
    await runNodeScript(suggestBaselineScriptPath, {
      cwd: tempDirectory,
      env: {
        SIM_BASELINE_SUGGEST_RUNS: '2',
      },
    });

    const { stdout } = await runNodeScript(validateArtifactsScriptPath, {
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
