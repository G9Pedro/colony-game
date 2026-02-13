import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { collectReportDiagnostics } from './reportDiagnosticsTestUtils.js';
import { VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH } from './validateReportDiagnosticsSmokeTestUtils.js';

const execFileAsync = promisify(execFile);

export function runValidateReportDiagnosticsSmoke(envOverrides = {}) {
  return execFileAsync(process.execPath, [VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH], {
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}

export function findDiagnosticByCode({ stdout = '', stderr = '' }, diagnosticCode) {
  const diagnostics = collectReportDiagnostics(stdout, stderr);
  return diagnostics.find((diagnostic) => diagnostic.code === diagnosticCode) ?? null;
}

export async function assertValidateSmokeRejectsWithDiagnostic({
  envOverrides,
  diagnosticCode,
  expectedRunId,
}) {
  await assert.rejects(
    () => runValidateReportDiagnosticsSmoke(envOverrides),
    (error) => {
      const diagnostic = findDiagnosticByCode(
        { stdout: error.stdout, stderr: error.stderr },
        diagnosticCode,
      );
      assert.ok(diagnostic);
      assert.equal(diagnostic.script, 'diagnostics:smoke:validate');
      if (expectedRunId !== undefined) {
        assert.equal(diagnostic.runId, expectedRunId);
      }
      return true;
    },
  );
}
