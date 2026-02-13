import { REPORT_KINDS, hasValidMeta } from './reportPayloadMeta.js';
import { isRecordOfNumbers } from './reportPayloadValidatorUtils.js';
import {
  areRecommendedActionsEqual,
  buildRecommendedActionsFromResults,
  isValidRecommendedActions,
  isValidReportArtifactResultEntry,
  KNOWN_REPORT_ARTIFACT_STATUSES,
} from './reportArtifactValidationPayloadHelpers.js';

export function isValidReportArtifactsValidationPayload(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const hasValidStatusCounts = isRecordOfNumbers(payload?.statusCounts);
  const hasValidActions = isValidRecommendedActions(payload?.recommendedActions);
  if (
    !Boolean(
      hasValidMeta(payload, REPORT_KINDS.reportArtifactsValidation) &&
        typeof payload.overallPassed === 'boolean' &&
        Number.isInteger(payload.failureCount) &&
        payload.failureCount >= 0 &&
        Number.isInteger(payload.totalChecked) &&
        payload.totalChecked >= 0 &&
        hasValidStatusCounts &&
        hasValidActions &&
        Array.isArray(payload.results),
    )
  ) {
    return false;
  }

  const validResults = results.every((result) => isValidReportArtifactResultEntry(result));
  if (!validResults) {
    return false;
  }

  const failureCount = results.filter((result) => !result.ok).length;
  const computedStatusCounts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});
  const computedStatusTotal = Object.values(computedStatusCounts).reduce((sum, value) => sum + value, 0);
  const reportedStatusTotal = Object.values(payload.statusCounts).reduce((sum, value) => sum + value, 0);
  const statusCountsMatch = Object.keys(computedStatusCounts).every(
    (status) => payload.statusCounts[status] === computedStatusCounts[status],
  );
  const knownStatusKeysOnly = Object.keys(payload.statusCounts).every((status) =>
    KNOWN_REPORT_ARTIFACT_STATUSES.has(status),
  );
  const statusKeySetMatches = Object.keys(payload.statusCounts).length === Object.keys(computedStatusCounts).length;
  const expectedRecommendedActions = buildRecommendedActionsFromResults(results);
  const recommendedActionsMatch = areRecommendedActionsEqual(
    payload.recommendedActions,
    expectedRecommendedActions,
  );

  return Boolean(
    payload.totalChecked === results.length &&
      payload.failureCount === failureCount &&
      payload.overallPassed === (failureCount === 0) &&
      reportedStatusTotal === payload.totalChecked &&
      computedStatusTotal === payload.totalChecked &&
      knownStatusKeysOnly &&
      statusKeySetMatches &&
      statusCountsMatch &&
      recommendedActionsMatch,
  );
}
