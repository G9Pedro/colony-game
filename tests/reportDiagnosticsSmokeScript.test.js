import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('report diagnostics smoke script emits passing diagnostics summary report', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'report-diagnostics-smoke-'));
  const outputPath = path.join(tempDirectory, 'report-diagnostics-smoke.json');
  const runId = 'smoke-script-test-run';
  const scriptPath = path.resolve('scripts/report-diagnostics-smoke.js');

  try {
    const { stdout } = await execFileAsync(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH: outputPath,
        REPORT_DIAGNOSTICS_RUN_ID: runId,
      },
    });

    assert.match(stdout, /Diagnostics smoke summary: scenarios=\d+, failed=0, diagnostics=\d+/);
    const summary = JSON.parse(await readFile(outputPath, 'utf-8'));
    assert.equal(summary.runId, runId);
    assert.equal(summary.scenarioCount, 4);
    assert.equal(summary.failedScenarioCount, 0);
    assert.equal(summary.passedScenarioCount, 4);
    assert.ok(summary.diagnosticsCount > 0);
    assert.equal(summary.scenarios.length, 4);
    summary.scenarios.forEach((scenario) => {
      assert.equal(scenario.ok, true);
      assert.ok(scenario.diagnosticsCount > 0);
      assert.equal(scenario.errors.length, 0);
    });
    assert.ok(summary.diagnosticsByCode['artifact-missing'] >= 1);
    assert.ok(summary.diagnosticsByCode['baseline-signature-drift'] >= 1);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
