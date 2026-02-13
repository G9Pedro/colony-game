import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function runNodeDiagnosticsScript(scriptPath, { cwd = undefined, env = {} } = {}) {
  return execFileAsync(process.execPath, [scriptPath], {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
  });
}

export async function assertNodeDiagnosticsScriptRejects({
  scriptPath,
  cwd = undefined,
  env = {},
  assertion,
}) {
  await assert.rejects(
    () => runNodeDiagnosticsScript(scriptPath, { cwd, env }),
    assertion,
  );
}
