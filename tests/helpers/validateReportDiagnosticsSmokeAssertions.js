import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  assertOutputHasReadFailureDiagnostic,
  findDiagnosticByCodeFromOutput,
} from './reportDiagnosticsTestUtils.js';
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

export async function assertValidateSmokeRejectsWithDiagnostic({
  envOverrides,
  diagnosticCode,
  expectedRunId,
  expectedPath = undefined,
  expectedStatus = 'error',
  expectedErrorCode = undefined,
}) {
  await assert.rejects(
    () => runValidateReportDiagnosticsSmoke(envOverrides),
    (error) => {
      const diagnostic = findDiagnosticByCodeFromOutput(
        { stdout: error.stdout, stderr: error.stderr },
        diagnosticCode,
      );
      assert.equal(diagnostic.script, 'diagnostics:smoke:validate');
      if (expectedRunId !== undefined) {
        assert.equal(diagnostic.runId, expectedRunId);
      }
      if (expectedPath !== undefined) {
        assertOutputHasReadFailureDiagnostic({
          stdout: error.stdout,
          stderr: error.stderr,
          diagnosticCode,
          expectedScript: 'diagnostics:smoke:validate',
          expectedPath,
          expectedStatus,
          expectedErrorCode,
        });
      }
      return true;
    },
  );
}
