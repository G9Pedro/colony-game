import {
  assertOutputHasDiagnostic,
  assertOutputHasReadFailureDiagnosticContract,
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
  expectedLevel = undefined,
  expectedPath = undefined,
  expectedStatus = 'error',
  expectedErrorCode = undefined,
}) {
  await assertNodeDiagnosticsScriptRejects({
    scriptPath: VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH,
    env: envOverrides,
    assertion: (error) => {
      if (expectedPath !== undefined) {
        assertOutputHasReadFailureDiagnosticContract({
          stdout: error.stdout,
          stderr: error.stderr,
          expectedCodes: [diagnosticCode],
          diagnosticCode,
          expectedScript: 'diagnostics:smoke:validate',
          expectedRunId,
          expectedLevel,
          expectedPath,
          expectedStatus,
          expectedErrorCode,
        });
        return true;
      }
      assertOutputHasDiagnostic({
        stdout: error.stdout,
        stderr: error.stderr,
        diagnosticCode,
        expectedScript: 'diagnostics:smoke:validate',
        expectedRunId,
        expectedLevel,
      });
      return true;
    },
  });
}
