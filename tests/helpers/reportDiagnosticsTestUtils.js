import assert from 'node:assert/strict';
import {
  isValidReportDiagnosticPayload,
  parseReportDiagnosticsFromText,
  REPORT_DIAGNOSTICS_SCHEMA_VERSION,
} from '../../scripts/reportDiagnostics.js';

export function collectReportDiagnostics(stdout = '', stderr = '') {
  return [...parseReportDiagnosticsFromText(stdout), ...parseReportDiagnosticsFromText(stderr)];
}

export function getDiagnosticByCode(diagnostics, code) {
  return (diagnostics ?? []).find((entry) => entry.code === code) ?? null;
}

export function assertReportDiagnosticsContract({
  diagnostics,
  expectedCodes = [],
  expectedScript = undefined,
  expectedRunId = undefined,
}) {
  assert.ok(Array.isArray(diagnostics));
  assert.ok(diagnostics.length > 0);

  const observedCodes = new Set();
  for (const diagnostic of diagnostics) {
    assert.equal(isValidReportDiagnosticPayload(diagnostic), true);
    assert.equal(diagnostic.schemaVersion, REPORT_DIAGNOSTICS_SCHEMA_VERSION);
    assert.equal(typeof diagnostic.generatedAt, 'string');
    assert.equal(new Date(diagnostic.generatedAt).toISOString(), diagnostic.generatedAt);
    if (expectedScript !== undefined) {
      assert.equal(diagnostic.script, expectedScript);
    }
    if (expectedRunId !== undefined) {
      assert.equal(diagnostic.runId, expectedRunId);
    }
    observedCodes.add(diagnostic.code);
  }

  expectedCodes.forEach((expectedCode) => {
    assert.equal(observedCodes.has(expectedCode), true);
  });
}

export function assertOutputDiagnosticsContract({
  stdout = '',
  stderr = '',
  expectedCodes = [],
  expectedScript = undefined,
  expectedRunId = undefined,
}) {
  const diagnostics = collectReportDiagnostics(stdout, stderr);
  assertReportDiagnosticsContract({
    diagnostics,
    expectedCodes,
    expectedScript,
    expectedRunId,
  });
  return diagnostics;
}

export function findDiagnosticByCode(diagnostics, code) {
  const diagnostic = getDiagnosticByCode(diagnostics, code);
  assert.ok(diagnostic);
  return diagnostic;
}

export function getDiagnosticByCodeFromOutput({ stdout = '', stderr = '' }, code) {
  return getDiagnosticByCode(collectReportDiagnostics(stdout, stderr), code);
}

export function findDiagnosticByCodeFromOutput({ stdout = '', stderr = '' }, code) {
  return findDiagnosticByCode(collectReportDiagnostics(stdout, stderr), code);
}

export function assertReadFailureDiagnosticContext({
  diagnostic,
  expectedPath,
  expectedStatus = 'error',
  expectedErrorCode = undefined,
}) {
  assert.equal(diagnostic.context?.path, expectedPath);
  assert.equal(diagnostic.context?.status, expectedStatus);
  if (expectedErrorCode !== undefined) {
    assert.equal(diagnostic.context?.errorCode, expectedErrorCode);
  }
}

export function assertOutputHasReadFailureDiagnostic({
  stdout = '',
  stderr = '',
  diagnosticCode,
  expectedScript = undefined,
  expectedPath,
  expectedStatus = 'error',
  expectedErrorCode = undefined,
}) {
  const diagnostics = collectReportDiagnostics(stdout, stderr);
  const diagnostic = findDiagnosticByCode(diagnostics, diagnosticCode);
  if (expectedScript !== undefined) {
    assert.equal(diagnostic.script, expectedScript);
  }
  assertReadFailureDiagnosticContext({
    diagnostic,
    expectedPath,
    expectedStatus,
    expectedErrorCode,
  });
  return diagnostic;
}

export function assertOutputHasDiagnostic({
  stdout = '',
  stderr = '',
  diagnosticCode,
  expectedScript = undefined,
  expectedRunId = undefined,
  expectedLevel = undefined,
}) {
  const diagnostics = collectReportDiagnostics(stdout, stderr);
  const diagnostic = findDiagnosticByCode(diagnostics, diagnosticCode);
  if (expectedScript !== undefined) {
    assert.equal(diagnostic.script, expectedScript);
  }
  if (expectedRunId !== undefined) {
    assert.equal(diagnostic.runId, expectedRunId);
  }
  if (expectedLevel !== undefined) {
    assert.equal(diagnostic.level, expectedLevel);
  }
  return diagnostic;
}
