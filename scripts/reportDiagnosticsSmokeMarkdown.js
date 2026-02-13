import { isValidDiagnosticsSmokeSummaryPayload } from './reportDiagnosticsSmokeSummary.js';

function sortRecordEntries(record) {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

function buildCounterRows(record) {
  return sortRecordEntries(record)
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join('\n');
}

function buildScenarioRows(scenarios) {
  return scenarios
    .map((scenario) => {
      const status = scenario.ok ? 'pass' : 'fail';
      return `| ${scenario.name} | ${scenario.expectedScript} | ${scenario.expectedExitCode} | ${scenario.actualExitCode} | ${scenario.diagnosticsCount} | ${status} |`;
    })
    .join('\n');
}

function buildFailureSections(scenarios) {
  const failingScenarios = scenarios.filter((scenario) => !scenario.ok);
  if (failingScenarios.length === 0) {
    return '## Failures\n\nAll diagnostics smoke scenarios passed.';
  }

  const sections = failingScenarios.map(
    (scenario) =>
      `### ${scenario.name}\n- expected script: \`${scenario.expectedScript}\`\n- exit code: expected \`${scenario.expectedExitCode}\`, actual \`${scenario.actualExitCode}\`\n- errors:\n${scenario.errors.map((error) => `  - ${error}`).join('\n')}`,
  );
  return ['## Failures', ...sections].join('\n\n');
}

export function buildDiagnosticsSmokeMarkdown(summaryPayload) {
  if (!isValidDiagnosticsSmokeSummaryPayload(summaryPayload)) {
    throw new Error('Cannot render diagnostics smoke markdown from invalid summary payload.');
  }

  return `# Report Diagnostics Smoke Summary

- generated at: ${summaryPayload.generatedAt}
- run id: ${summaryPayload.runId}
- scenarios: ${summaryPayload.scenarioCount}
- passed: ${summaryPayload.passedScenarioCount}
- failed: ${summaryPayload.failedScenarioCount}
- diagnostics: ${summaryPayload.diagnosticsCount}

## Scenario results

| Scenario | Expected script | Expected exit | Actual exit | Diagnostics | Status |
| --- | --- | --- | --- | --- | --- |
${buildScenarioRows(summaryPayload.scenarios)}

## Diagnostic counts by code

| Code | Count |
| --- | --- |
${buildCounterRows(summaryPayload.diagnosticsByCode)}

## Diagnostic counts by level

| Level | Count |
| --- | --- |
${buildCounterRows(summaryPayload.diagnosticsByLevel)}

## Diagnostic counts by script

| Script | Count |
| --- | --- |
${buildCounterRows(summaryPayload.diagnosticsByScript)}

${buildFailureSections(summaryPayload.scenarios)}
`;
}

export function isValidDiagnosticsSmokeMarkdown(markdownText, summaryPayload) {
  if (typeof markdownText !== 'string' || markdownText.length === 0) {
    return false;
  }
  if (!isValidDiagnosticsSmokeSummaryPayload(summaryPayload)) {
    return false;
  }

  const requiredSnippets = [
    '# Report Diagnostics Smoke Summary',
    `- run id: ${summaryPayload.runId}`,
    `- scenarios: ${summaryPayload.scenarioCount}`,
    `- passed: ${summaryPayload.passedScenarioCount}`,
    `- failed: ${summaryPayload.failedScenarioCount}`,
    '## Scenario results',
    '## Diagnostic counts by code',
    '## Diagnostic counts by level',
    '## Diagnostic counts by script',
    '## Failures',
  ];

  return requiredSnippets.every((snippet) => markdownText.includes(snippet));
}
