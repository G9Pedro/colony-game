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

const REPORT_ARTIFACT_REGEN_COMMANDS = {
  'reports/scenario-tuning-validation.json': 'npm run simulate:validate:tuning',
  'reports/scenario-tuning-dashboard.json': 'npm run simulate:report:tuning',
  'reports/scenario-tuning-baseline-suggestions.json': 'npm run simulate:suggest:tuning-baseline',
  'reports/baseline-suggestions.json': 'npm run simulate:baseline:suggest',
};

function escapeMarkdownTableValue(value) {
  if (typeof value !== 'string') {
    return value ?? '';
  }
  return value.replaceAll('|', '\\|');
}

export function getReportArtifactRegenerationCommand(path) {
  return REPORT_ARTIFACT_REGEN_COMMANDS[path] ?? 'npm run verify';
}

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
      `| ${escapeMarkdownTableValue(result.path)} | ${escapeMarkdownTableValue(result.kind)} | ${escapeMarkdownTableValue(result.status)} | ${escapeMarkdownTableValue(result.message ?? '')} |`,
    );
  }

  const failingResults = (report.results ?? []).filter((result) => !result.ok);
  if (failingResults.length === 0) {
    lines.push('', '## Remediation Hints', '', '- No remediation needed. All artifacts are valid.', '');
    return `${lines.join('\n')}\n`;
  }

  lines.push('', '## Remediation Hints', '');
  const seenPaths = new Set();
  for (const result of failingResults) {
    if (seenPaths.has(result.path)) {
      continue;
    }
    seenPaths.add(result.path);
    const command = getReportArtifactRegenerationCommand(result.path);
    lines.push(`- ${result.path}: run \`${command}\` then re-run \`npm run reports:validate\`.`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}
