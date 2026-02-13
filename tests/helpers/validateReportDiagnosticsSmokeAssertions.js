import assert from 'node:assert/strict';
import {
  assertOutputHasReadFailureDiagnostic,
  findDiagnosticByCodeFromOutput,
} from './reportDiagnosticsTestUtils.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './reportDiagnosticsScriptTestUtils.js';
import { VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH } from './validateReportDiagnosticsSmokeTestUtils.js';

export function runValidateReportDiagnosticsSmoke(envOverrides = {}) {
  return runNodeDiagnosticsScript(VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH, {
    env: envOverrides,
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
  await assertNodeDiagnosticsScriptRejects({
    scriptPath: VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH,
    env: envOverrides,
    assertion: (error) => {
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
  });
}
