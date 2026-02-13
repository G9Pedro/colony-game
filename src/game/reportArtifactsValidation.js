import { REPORT_KINDS, validateReportPayloadByKind } from './reportPayloadValidators.js';

export const REPORT_ARTIFACT_TARGETS = [
  { path: 'reports/scenario-tuning-validation.json', kind: REPORT_KINDS.scenarioTuningValidation },
  { path: 'reports/scenario-tuning-dashboard.json', kind: REPORT_KINDS.scenarioTuningDashboard },
  {
    path: 'reports/scenario-tuning-baseline-suggestions.json',
    kind: REPORT_KINDS.scenarioTuningBaselineSuggestions,
  },
  { path: 'reports/baseline-suggestions.json', kind: REPORT_KINDS.baselineSuggestions },
];

export function evaluateReportArtifactEntries(entries) {
  const results = entries.map((entry) => {
    if (entry.errorType === 'invalid-json') {
      return {
        path: entry.path,
        kind: entry.kind,
        status: 'invalid-json',
        ok: false,
        message: entry.message ?? 'Invalid JSON payload.',
      };
    }

    if (entry.errorType) {
      return {
        path: entry.path,
        kind: entry.kind,
        status: 'error',
        ok: false,
        message: entry.message ?? 'Failed to read report artifact.',
      };
    }

    const validation = validateReportPayloadByKind(entry.kind, entry.payload);
    if (!validation.ok) {
      return {
        path: entry.path,
        kind: entry.kind,
        status: 'invalid',
        ok: false,
        message: validation.reason,
      };
    }

    return {
      path: entry.path,
      kind: entry.kind,
      status: 'ok',
      ok: true,
      message: null,
    };
  });

  const failureCount = results.filter((result) => !result.ok).length;
  return {
    overallPassed: failureCount === 0,
    failureCount,
    totalChecked: results.length,
    results,
  };
}

export function buildReportArtifactsValidationMarkdown(report) {
  const statusLabel = report.overallPassed ? 'Passed' : 'Failed';
  const lines = [
    '# Report Artifacts Validation',
    '',
    `- Status: ${statusLabel}`,
    `- Total Checked: ${report.totalChecked}`,
    `- Failed: ${report.failureCount}`,
    '',
    '## Results',
    '',
    '| Artifact | Kind | Status | Message |',
    '| --- | --- | --- | --- |',
  ];

  for (const result of report.results ?? []) {
    lines.push(
      `| ${result.path} | ${result.kind} | ${result.status} | ${result.message ?? ''} |`,
    );
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}
