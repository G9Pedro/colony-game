import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './helpers/reportDiagnosticsScriptTestUtils.js';

test('runNodeDiagnosticsScript executes with env overrides and cwd', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-script-test-utils-run-'));
  const scriptPath = path.join(tempDirectory, 'echo-env-and-cwd.js');

  try {
    await writeFile(
      scriptPath,
      [
        'const payload = {',
        '  cwd: process.cwd(),',
        '  value: process.env.TEST_DIAGNOSTICS_HELPER_VALUE ?? null,',
        '};',
        'process.stdout.write(`${JSON.stringify(payload)}\\n`);',
      ].join('\n'),
      'utf-8',
    );

    const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
      cwd: tempDirectory,
      env: {
        TEST_DIAGNOSTICS_HELPER_VALUE: 'expected-value',
      },
    });
    assert.equal(stderr, '');

    const payload = JSON.parse(stdout.trim());
    assert.equal(payload.cwd, tempDirectory);
    assert.equal(payload.value, 'expected-value');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('assertNodeDiagnosticsScriptRejects forwards rejected process details', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'diagnostic-script-test-utils-reject-'));
  const scriptPath = path.join(tempDirectory, 'reject-with-message.js');

  try {
    await writeFile(
      scriptPath,
      [
        "process.stdout.write('script-stdout\\n');",
        "process.stderr.write('script-stderr\\n');",
        'process.exitCode = 1;',
      ].join('\n'),
      'utf-8',
    );

    await assertNodeDiagnosticsScriptRejects({
      scriptPath,
      cwd: tempDirectory,
      assertion: (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stdout, /script-stdout/);
        assert.match(error.stderr, /script-stderr/);
        return true;
      },
    });
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
