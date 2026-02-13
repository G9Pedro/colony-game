import { REPORT_KINDS, REPORT_SCHEMA_VERSIONS, hasValidMeta } from './reportPayloadMeta.js';
import { isRecordOfNumbers } from './reportPayloadValidatorUtils.js';
import {
  areRecommendedActionsEqual,
  buildRecommendedActionsFromResults,
  computeReportArtifactStatusCounts,
  doReportArtifactStatusCountsMatch,
  getReportArtifactStatusCountsTotal,
  hasExpectedReportArtifactStatusKeys,
  isValidRecommendedActions,
  isValidReportArtifactResultEntry,
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
  const hasKnownResultKinds = results.every((result) =>
    Object.prototype.hasOwnProperty.call(REPORT_SCHEMA_VERSIONS, result.kind),
  );
  const hasUniqueResultPaths = new Set(results.map((result) => result.path)).size === results.length;
  const hasSortedResultPaths = results.every(
    (result, index) => index === 0 || results[index - 1].path.localeCompare(result.path) <= 0,
  );

  const failureCount = results.filter((result) => !result.ok).length;
  const computedStatusCounts = computeReportArtifactStatusCounts(results);
  const computedStatusTotal = getReportArtifactStatusCountsTotal(computedStatusCounts);
  const reportedStatusTotal = getReportArtifactStatusCountsTotal(payload.statusCounts);
  const hasExpectedStatusKeys = hasExpectedReportArtifactStatusKeys(payload.statusCounts);
  const statusCountsMatch = doReportArtifactStatusCountsMatch(payload.statusCounts, computedStatusCounts);
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
      hasExpectedStatusKeys &&
      statusCountsMatch &&
      hasKnownResultKinds &&
      hasUniqueResultPaths &&
      hasSortedResultPaths &&
      recommendedActionsMatch,
  );
}
