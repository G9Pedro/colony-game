import { REPORT_KINDS, validateReportPayloadByKind } from './reportPayloadValidators.js';
import {
  REPORT_ARTIFACT_STATUSES,
  REPORT_ARTIFACT_STATUS_ORDER,
} from './reportArtifactValidationPayloadHelpers.js';

export const REPORT_ARTIFACT_TARGETS = [
  { path: 'reports/scenario-tuning-validation.json', kind: REPORT_KINDS.scenarioTuningValidation },
  { path: 'reports/scenario-tuning-dashboard.json', kind: REPORT_KINDS.scenarioTuningDashboard },
  { path: 'reports/scenario-tuning-trend.json', kind: REPORT_KINDS.scenarioTuningTrend },
  {
    path: 'reports/scenario-tuning-baseline-suggestions.json',
    kind: REPORT_KINDS.scenarioTuningBaselineSuggestions,
  },
  { path: 'reports/baseline-suggestions.json', kind: REPORT_KINDS.baselineSuggestions },
];

const REPORT_ARTIFACT_REGEN_COMMANDS = {
  'reports/scenario-tuning-validation.json': 'npm run simulate:validate:tuning',
  'reports/scenario-tuning-dashboard.json': 'npm run simulate:report:tuning',
  'reports/scenario-tuning-trend.json': 'npm run simulate:report:tuning:trend',
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

function buildRecommendedActions(results) {
  const actionMap = new Map();
  for (const result of results) {
    if (result.ok) {
      continue;
    }
    const command = result.recommendedCommand ?? getReportArtifactRegenerationCommand(result.path);
    if (!actionMap.has(command)) {
      actionMap.set(command, new Set());
    }
    actionMap.get(command).add(result.path);
  }

  return Array.from(actionMap.entries())
    .map(([command, paths]) => ({
      command,
      paths: Array.from(paths).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.command.localeCompare(b.command));
}

export function evaluateReportArtifactEntries(entries) {
  const results = entries
    .map((entry) => {
      const recommendedCommand = getReportArtifactRegenerationCommand(entry.path);
      if (entry.errorType === 'invalid-json') {
        return {
          path: entry.path,
          kind: entry.kind,
          status: REPORT_ARTIFACT_STATUSES.invalidJson,
          ok: false,
          message: entry.message ?? 'Invalid JSON payload.',
          recommendedCommand,
        };
      }

      if (entry.errorType) {
        return {
          path: entry.path,
          kind: entry.kind,
          status: REPORT_ARTIFACT_STATUSES.error,
          ok: false,
          message: entry.message ?? 'Failed to read report artifact.',
          recommendedCommand,
        };
      }

      const validation = validateReportPayloadByKind(entry.kind, entry.payload);
      if (!validation.ok) {
        return {
          path: entry.path,
          kind: entry.kind,
          status: REPORT_ARTIFACT_STATUSES.invalid,
          ok: false,
          message: validation.reason,
          recommendedCommand,
        };
      }

      return {
        path: entry.path,
        kind: entry.kind,
        status: REPORT_ARTIFACT_STATUSES.ok,
        ok: true,
        message: null,
        recommendedCommand: null,
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  const failureCount = results.filter((result) => !result.ok).length;
  const statusCounts = results.reduce(
    (acc, result) => {
      acc[result.status] += 1;
      return acc;
    },
    Object.fromEntries(REPORT_ARTIFACT_STATUS_ORDER.map((status) => [status, 0])),
  );
  const recommendedActions = buildRecommendedActions(results);
  return {
    overallPassed: failureCount === 0,
    failureCount,
    totalChecked: results.length,
    statusCounts,
    recommendedActions,
    results,
  };
}

export function buildReportArtifactsValidationMarkdown(report) {
  const statusLabel = report.overallPassed ? 'Passed' : 'Failed';
  const recommendedActions = report.recommendedActions ?? buildRecommendedActions(report.results ?? []);
  const lines = [
    '# Report Artifacts Validation',
    '',
    `- Status: ${statusLabel}`,
    `- Total Checked: ${report.totalChecked}`,
    `- Failed: ${report.failureCount}`,
    `- Status Counts: ${Object.entries(report.statusCounts ?? {})
      .map(([status, count]) => `${status}=${count}`)
      .join(', ')}`,
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

  if (recommendedActions.length > 0) {
    lines.push('', '## Recommended Commands', '');
    for (const action of recommendedActions) {
      lines.push(
        `- \`${action.command}\` (artifacts: ${action.paths.join(', ')})`,
      );
    }
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
    const command = result.recommendedCommand ?? getReportArtifactRegenerationCommand(result.path);
    lines.push(`- ${result.path}: run \`${command}\` then re-run \`npm run reports:validate\`.`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}
