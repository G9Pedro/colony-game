import {
  assertOutputHasDiagnostic,
} from './reportDiagnosticsTestUtils.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './reportDiagnosticsScriptTestUtils.js';
import {
  assertNodeDiagnosticsScriptReadFailureScenario,
  getReportReadFailureScenarioFromDiagnosticCode,
} from './reportReadFailureMatrixTestUtils.js';
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
  if (expectedPath !== undefined) {
    const readFailureScenario = getReportReadFailureScenarioFromDiagnosticCode(diagnosticCode);
    await assertNodeDiagnosticsScriptReadFailureScenario({
      scriptPath: VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH,
      env: envOverrides,
      scenario: readFailureScenario,
      expectedScript: 'diagnostics:smoke:validate',
      expectedRunId,
      expectedLevel,
      expectedPath,
      expectedStatus,
      expectedErrorCode,
      expectedCodes: [diagnosticCode],
    });
    return;
  }

  await assertNodeDiagnosticsScriptRejects({
    scriptPath: VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH,
    env: envOverrides,
    assertion: (error) => {
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
