export const REPORT_DIAGNOSTICS_SMOKE_SUMMARY_TYPE = 'report-diagnostics-smoke-summary';
export const REPORT_DIAGNOSTICS_SMOKE_SCHEMA_VERSION = 1;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isCanonicalIsoTimestamp(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return false;
  }
  return new Date(parsed).toISOString() === value;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function countBy(entries, getKey) {
  return entries.reduce((acc, entry) => {
    const key = getKey(entry);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function countMapTotal(record) {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

function isIntegerRecord(record) {
  return (
    isPlainObject(record) &&
    Object.values(record).every((value) => isNonNegativeInteger(value))
  );
}

function isSortedUniqueStringArray(values) {
  if (!Array.isArray(values) || !values.every((value) => isNonEmptyString(value))) {
    return false;
  }
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1].localeCompare(values[index]) >= 0) {
      return false;
    }
  }
  return true;
}

function toSummaryScenarioRow(result) {
  return {
    name: result.name,
    expectedScript: result.expectedScript,
    expectedExitCode: result.expectedExitCode,
    actualExitCode: result.actualExitCode,
    diagnosticsCount: result.diagnostics.length,
    observedCodes: result.observedCodes,
    ok: result.ok,
    errors: result.errors,
  };
}

export function buildDiagnosticsSmokeSummary({
  runId,
  scenarioResults,
  generatedAt = new Date().toISOString(),
}) {
  if (!isNonEmptyString(runId)) {
    throw new Error('Diagnostics smoke summary runId must be a non-empty string.');
  }
  if (!Array.isArray(scenarioResults)) {
    throw new Error('Diagnostics smoke summary scenarioResults must be an array.');
  }
  if (!isCanonicalIsoTimestamp(generatedAt)) {
    throw new Error(
      `Diagnostics smoke summary generatedAt must be canonical ISO-8601 timestamp (received "${generatedAt}").`,
    );
  }

  const allDiagnostics = scenarioResults.flatMap((result) => result.diagnostics);
  const failedScenarios = scenarioResults.filter((result) => !result.ok);
  const summary = {
    type: REPORT_DIAGNOSTICS_SMOKE_SUMMARY_TYPE,
    schemaVersion: REPORT_DIAGNOSTICS_SMOKE_SCHEMA_VERSION,
    generatedAt,
    runId,
    scenarioCount: scenarioResults.length,
    passedScenarioCount: scenarioResults.length - failedScenarios.length,
    failedScenarioCount: failedScenarios.length,
    diagnosticsCount: allDiagnostics.length,
    diagnosticsByCode: countBy(allDiagnostics, (entry) => entry.code),
    diagnosticsByLevel: countBy(allDiagnostics, (entry) => entry.level),
    diagnosticsByScript: countBy(allDiagnostics, (entry) => entry.script ?? 'null'),
    scenarios: scenarioResults.map((result) => toSummaryScenarioRow(result)),
  };

  return summary;
}

export function isValidDiagnosticsSmokeSummaryPayload(payload) {
  if (!isPlainObject(payload)) {
    return false;
  }
  if (payload.type !== REPORT_DIAGNOSTICS_SMOKE_SUMMARY_TYPE) {
    return false;
  }
  if (payload.schemaVersion !== REPORT_DIAGNOSTICS_SMOKE_SCHEMA_VERSION) {
    return false;
  }
  if (!isCanonicalIsoTimestamp(payload.generatedAt)) {
    return false;
  }
  if (!isNonEmptyString(payload.runId)) {
    return false;
  }
  if (!isNonNegativeInteger(payload.scenarioCount)) {
    return false;
  }
  if (!isNonNegativeInteger(payload.passedScenarioCount)) {
    return false;
  }
  if (!isNonNegativeInteger(payload.failedScenarioCount)) {
    return false;
  }
  if (!isNonNegativeInteger(payload.diagnosticsCount)) {
    return false;
  }
  if (!isIntegerRecord(payload.diagnosticsByCode)) {
    return false;
  }
  if (!isIntegerRecord(payload.diagnosticsByLevel)) {
    return false;
  }
  if (!isIntegerRecord(payload.diagnosticsByScript)) {
    return false;
  }
  if (!Array.isArray(payload.scenarios) || payload.scenarios.length !== payload.scenarioCount) {
    return false;
  }

  const passedScenarioCount = payload.scenarios.reduce(
    (count, scenario) => count + (scenario?.ok ? 1 : 0),
    0,
  );
  const diagnosticsCount = payload.scenarios.reduce(
    (count, scenario) => count + (scenario?.diagnosticsCount ?? 0),
    0,
  );

  const hasValidScenarios = payload.scenarios.every((scenario) => {
    if (!isPlainObject(scenario)) {
      return false;
    }
    if (!isNonEmptyString(scenario.name)) {
      return false;
    }
    if (!isNonEmptyString(scenario.expectedScript)) {
      return false;
    }
    if (!Number.isInteger(scenario.expectedExitCode)) {
      return false;
    }
    if (!Number.isInteger(scenario.actualExitCode)) {
      return false;
    }
    if (!isNonNegativeInteger(scenario.diagnosticsCount)) {
      return false;
    }
    if (!isSortedUniqueStringArray(scenario.observedCodes)) {
      return false;
    }
    if (typeof scenario.ok !== 'boolean') {
      return false;
    }
    if (!Array.isArray(scenario.errors) || !scenario.errors.every((error) => isNonEmptyString(error))) {
      return false;
    }
    if (scenario.ok && scenario.errors.length > 0) {
      return false;
    }
    if (!scenario.ok && scenario.errors.length === 0) {
      return false;
    }
    return true;
  });

  if (!hasValidScenarios) {
    return false;
  }
  if (payload.passedScenarioCount !== passedScenarioCount) {
    return false;
  }
  if (payload.failedScenarioCount !== payload.scenarioCount - payload.passedScenarioCount) {
    return false;
  }
  if (payload.diagnosticsCount !== diagnosticsCount) {
    return false;
  }
  if (countMapTotal(payload.diagnosticsByCode) !== payload.diagnosticsCount) {
    return false;
  }
  if (countMapTotal(payload.diagnosticsByLevel) !== payload.diagnosticsCount) {
    return false;
  }
  if (countMapTotal(payload.diagnosticsByScript) !== payload.diagnosticsCount) {
    return false;
  }

  return true;
}
