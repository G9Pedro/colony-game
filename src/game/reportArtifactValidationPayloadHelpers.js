import { areNormalizedJsonValuesEqual } from './reportPayloadValidatorUtils.js';

export const REPORT_ARTIFACT_STATUSES = Object.freeze({
  ok: 'ok',
  error: 'error',
  invalid: 'invalid',
  invalidJson: 'invalid-json',
});

export const REPORT_ARTIFACT_STATUS_ORDER = [
  REPORT_ARTIFACT_STATUSES.ok,
  REPORT_ARTIFACT_STATUSES.error,
  REPORT_ARTIFACT_STATUSES.invalid,
  REPORT_ARTIFACT_STATUSES.invalidJson,
];
export const KNOWN_REPORT_ARTIFACT_STATUSES = new Set(REPORT_ARTIFACT_STATUS_ORDER);

export function isValidRecommendedActions(value) {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof entry.command === 'string' &&
      entry.command.length > 0 &&
      Array.isArray(entry.paths) &&
      entry.paths.every((path) => typeof path === 'string' && path.length > 0),
  );
}

export function isValidReportArtifactResultEntry(result) {
  if (
    !Boolean(
      result &&
        typeof result === 'object' &&
        typeof result.path === 'string' &&
        result.path.length > 0 &&
        typeof result.kind === 'string' &&
        result.kind.length > 0 &&
        typeof result.status === 'string' &&
        KNOWN_REPORT_ARTIFACT_STATUSES.has(result.status) &&
        typeof result.ok === 'boolean' &&
        (result.message === null || typeof result.message === 'string') &&
        (result.recommendedCommand === null || typeof result.recommendedCommand === 'string'),
    )
  ) {
    return false;
  }

  if (result.ok) {
    return (
      result.status === REPORT_ARTIFACT_STATUSES.ok &&
      result.message === null &&
      result.recommendedCommand === null
    );
  }

  return (
    result.status !== REPORT_ARTIFACT_STATUSES.ok &&
    typeof result.message === 'string' &&
    result.message.length > 0 &&
    typeof result.recommendedCommand === 'string' &&
    result.recommendedCommand.length > 0
  );
}

export function buildRecommendedActionsFromResults(results) {
  const byCommand = new Map();
  for (const result of results ?? []) {
    if (result.ok) {
      continue;
    }
    const command = result.recommendedCommand;
    if (!byCommand.has(command)) {
      byCommand.set(command, new Set());
    }
    byCommand.get(command).add(result.path);
  }

  return Array.from(byCommand.entries())
    .map(([command, pathSet]) => ({
      command,
      paths: Array.from(pathSet).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.command.localeCompare(b.command));
}

export function normalizeRecommendedActions(actions) {
  return (actions ?? [])
    .map((action) => ({
      command: action.command,
      paths: [...action.paths].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.command.localeCompare(b.command));
}

export function areRecommendedActionsEqual(left, right) {
  return areNormalizedJsonValuesEqual(normalizeRecommendedActions(left), normalizeRecommendedActions(right));
}
