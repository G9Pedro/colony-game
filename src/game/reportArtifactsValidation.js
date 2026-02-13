import { validateReportPayloadByKind } from './reportPayloadValidators.js';
import {
  buildReportArtifactResultStatistics,
  buildRecommendedActionsFromResults,
  formatReportArtifactStatusCounts,
  REPORT_ARTIFACT_ENTRY_ERROR_TYPES,
  REPORT_ARTIFACT_STATUSES,
} from './reportArtifactValidationPayloadHelpers.js';
import {
  getReportArtifactRegenerationCommand,
  REPORT_ARTIFACT_TARGETS,
} from './reportArtifactsManifest.js';

export { REPORT_ARTIFACT_TARGETS, getReportArtifactRegenerationCommand };

function escapeMarkdownTableValue(value) {
  if (typeof value !== 'string') {
    return value ?? '';
  }
  return value.replaceAll('|', '\\|');
}

function buildRecommendedActions(results) {
  return buildRecommendedActionsFromResults(results, {
    resolveCommand: (result) =>
      result.recommendedCommand ?? getReportArtifactRegenerationCommand(result.path),
  });
}

export function evaluateReportArtifactEntries(entries) {
  const results = entries
    .map((entry) => {
      const recommendedCommand = getReportArtifactRegenerationCommand(entry.path);
      if (entry.errorType === REPORT_ARTIFACT_ENTRY_ERROR_TYPES.invalidJson) {
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

  const {
    overallPassed,
    failureCount,
    totalChecked,
    statusCounts,
  } = buildReportArtifactResultStatistics(results);
  const recommendedActions = buildRecommendedActions(results);
  return {
    overallPassed,
    failureCount,
    totalChecked,
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
    `- Status Counts: ${formatReportArtifactStatusCounts(report.statusCounts)}`,
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
