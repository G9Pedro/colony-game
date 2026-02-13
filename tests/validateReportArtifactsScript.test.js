import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { REPORT_ARTIFACT_TARGETS } from '../src/game/reportArtifactsValidation.js';

const execFileAsync = promisify(execFile);

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
    assert.match(dashboardRow.message, /unexpected/i);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
