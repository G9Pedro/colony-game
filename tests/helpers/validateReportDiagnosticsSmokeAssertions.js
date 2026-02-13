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

export async function assertValidateSmokeRejectsWithReadFailureScenario({
  envOverrides,
  scenario,
  expectedRunId,
  expectedLevel = undefined,
  expectedPath,
  expectedStatus = undefined,
  expectedErrorCode = undefined,
  expectedDiagnosticCode = undefined,
}) {
  await assertNodeDiagnosticsScriptReadFailureScenario({
    scriptPath: VALIDATE_REPORT_DIAGNOSTICS_SMOKE_SCRIPT_PATH,
    env: envOverrides,
    scenario,
    expectedScript: 'diagnostics:smoke:validate',
    expectedRunId,
    expectedLevel,
    expectedPath,
    expectedStatus,
    expectedErrorCode,
    expectedCodes: expectedDiagnosticCode === undefined ? undefined : [expectedDiagnosticCode],
  });
}

export async function assertValidateSmokeRejectsWithDiagnostic({
  envOverrides,
  diagnosticCode,
  expectedRunId,
  expectedLevel = undefined,
  expectedPath = undefined,
  expectedStatus = undefined,
  expectedErrorCode = undefined,
}) {
  if (expectedPath !== undefined) {
    let readFailureScenario;
    try {
      readFailureScenario = getReportReadFailureScenarioFromDiagnosticCode(diagnosticCode);
    } catch (error) {
      throw new Error(
        `Read-failure assertion path "${expectedPath}" is only valid for read-failure diagnostic codes. Received "${diagnosticCode}".`,
        { cause: error },
      );
    }
    await assertValidateSmokeRejectsWithReadFailureScenario({
      envOverrides,
      scenario: readFailureScenario,
      expectedRunId,
      expectedLevel,
      expectedPath,
      expectedStatus,
      expectedErrorCode,
      expectedDiagnosticCode: diagnosticCode,
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
