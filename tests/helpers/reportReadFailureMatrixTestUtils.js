import { READ_ARTIFACT_DIAGNOSTIC_CODES } from '../../scripts/reportPayloadInput.js';
import assert from 'node:assert/strict';
import {
  assertOutputHasReadFailureDiagnosticContract,
  assertReadFailureDiagnosticContext,
} from './reportDiagnosticsTestUtils.js';
import {
  assertNodeDiagnosticsScriptRejects,
  runNodeDiagnosticsScript,
} from './reportDiagnosticsScriptTestUtils.js';

export const REPORT_READ_FAILURE_SCENARIO_CONTRACTS = Object.freeze({
  missing: Object.freeze({
    diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.missing,
    status: 'missing',
    errorCode: 'ENOENT',
  }),
  invalidJson: Object.freeze({
    diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.invalidJson,
    status: 'invalid-json',
    errorCode: null,
  }),
  invalidPayload: Object.freeze({
    diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.invalidPayload,
    status: 'invalid',
    errorCode: null,
  }),
  unreadable: Object.freeze({
    diagnosticCode: READ_ARTIFACT_DIAGNOSTIC_CODES.readError,
    status: 'error',
    errorCode: 'EISDIR',
  }),
});

export function getReportReadFailureScenarioContract(scenario) {
  const contract = REPORT_READ_FAILURE_SCENARIO_CONTRACTS[scenario];
  if (contract === undefined) {
    throw new Error(`Unknown read-failure scenario "${scenario}".`);
  }
  return contract;
}

export function getReportReadFailureScenarioFromDiagnosticCode(diagnosticCode) {
  const scenarioEntry = Object.entries(REPORT_READ_FAILURE_SCENARIO_CONTRACTS).find(
    ([, contract]) => contract.diagnosticCode === diagnosticCode,
  );
  if (scenarioEntry === undefined) {
    throw new Error(
      `Unknown read-failure diagnostic code "${diagnosticCode}" for scenario mapping.`,
    );
  }
  return scenarioEntry[0];
}

export async function assertNodeDiagnosticsScriptReadFailureScenario({
  scriptPath,
  cwd = undefined,
  env = {},
  scenario,
  expectedScript,
  expectedRunId,
  expectedLevel = undefined,
  expectedPath,
  expectedStatus = undefined,
  expectedErrorCode = undefined,
  expectedCodes = undefined,
  assertDiagnostic = undefined,
}) {
  const scenarioContract = getReportReadFailureScenarioContract(scenario);
  const status = expectedStatus ?? scenarioContract.status;
  const errorCode = expectedErrorCode ?? scenarioContract.errorCode;
  const diagnosticCode = scenarioContract.diagnosticCode;
  const codes = expectedCodes ?? [diagnosticCode];

  await assertNodeDiagnosticsScriptRejects({
    scriptPath,
    cwd,
    env,
    assertion: (error) => {
      const diagnostic = assertOutputHasReadFailureDiagnosticContract({
        stdout: error.stdout,
        stderr: error.stderr,
        expectedCodes: codes,
        diagnosticCode,
        expectedScript,
        expectedRunId,
        expectedLevel,
        expectedPath,
        expectedStatus: status,
        expectedErrorCode: errorCode,
      });
      if (assertDiagnostic !== undefined) {
        assertDiagnostic({
          error,
          diagnostic,
          scenarioContract,
        });
      }
      return true;
    },
  });
}

export function assertOutputHasReadFailureScenarioContract({
  stdout = '',
  stderr = '',
  scenario,
  expectedScript,
  expectedRunId = undefined,
  expectedLevel = undefined,
  expectedPath,
  expectedStatus = undefined,
  expectedErrorCode = undefined,
  expectedCodes = undefined,
}) {
  const scenarioContract = getReportReadFailureScenarioContract(scenario);
  const diagnosticCode = scenarioContract.diagnosticCode;
  return assertOutputHasReadFailureDiagnosticContract({
    stdout,
    stderr,
    expectedCodes: expectedCodes ?? [diagnosticCode],
    diagnosticCode,
    expectedScript,
    expectedRunId,
    expectedLevel,
    expectedPath,
    expectedStatus: expectedStatus ?? scenarioContract.status,
    expectedErrorCode: expectedErrorCode ?? scenarioContract.errorCode,
  });
}

export function assertReadFailureDiagnosticMatchesScenario({
  diagnostic,
  scenario,
  expectedPath,
  expectedLevel = undefined,
  expectedStatus = undefined,
  expectedErrorCode = undefined,
}) {
  const scenarioContract = getReportReadFailureScenarioContract(scenario);
  assert.equal(diagnostic.code, scenarioContract.diagnosticCode);
  if (expectedLevel !== undefined) {
    assert.equal(diagnostic.level, expectedLevel);
  }
  assertReadFailureDiagnosticContext({
    diagnostic,
    expectedPath,
    expectedStatus: expectedStatus ?? scenarioContract.status,
    expectedErrorCode: expectedErrorCode ?? scenarioContract.errorCode,
  });
  return diagnostic;
}

export async function assertNodeDiagnosticsScriptOutputsReadFailureScenario({
  scriptPath,
  cwd = undefined,
  env = {},
  scenario,
  expectedScript,
  expectedRunId = undefined,
  expectedLevel = undefined,
  expectedPath,
  expectedStatus = undefined,
  expectedErrorCode = undefined,
  expectedCodes = undefined,
  assertDiagnostic = undefined,
}) {
  const scenarioContract = getReportReadFailureScenarioContract(scenario);
  const { stdout, stderr } = await runNodeDiagnosticsScript(scriptPath, {
    cwd,
    env,
  });
  const diagnostic = assertOutputHasReadFailureScenarioContract({
    stdout,
    stderr,
    scenario,
    expectedScript,
    expectedRunId,
    expectedLevel,
    expectedPath,
    expectedStatus: expectedStatus ?? scenarioContract.status,
    expectedErrorCode: expectedErrorCode ?? scenarioContract.errorCode,
    expectedCodes: expectedCodes ?? [scenarioContract.diagnosticCode],
  });
  if (assertDiagnostic !== undefined) {
    assertDiagnostic({
      stdout,
      stderr,
      diagnostic,
      scenarioContract,
    });
  }
  return {
    stdout,
    stderr,
    diagnostic,
  };
}
