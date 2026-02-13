import { REPORT_KINDS, hasValidMeta } from './reportPayloadMeta.js';
import {
  areReportArtifactResultsSortedByPath,
  areRecommendedActionsEqual,
  buildReportArtifactResultStatistics,
  buildRecommendedActionsFromResults,
  doReportArtifactStatusCountsMatch,
  getReportArtifactStatusCountsTotal,
  isValidReportArtifactStatusCounts,
  hasUniqueReportArtifactResultPaths,
  isValidRecommendedActions,
  isValidReportArtifactResultEntry,
} from './reportArtifactValidationPayloadHelpers.js';
import {
  hasExactReportArtifactTargets,
} from './reportArtifactsManifest.js';

export function isValidReportArtifactsValidationPayload(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const hasValidStatusCounts = isValidReportArtifactStatusCounts(payload?.statusCounts);
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
  const hasExactTargets = hasExactReportArtifactTargets(results);
  const hasUniqueResultPaths = hasUniqueReportArtifactResultPaths(results);
  const hasSortedResultPaths = areReportArtifactResultsSortedByPath(results);

  const computedSummary = buildReportArtifactResultStatistics(results);
  const reportedStatusTotal = getReportArtifactStatusCountsTotal(payload.statusCounts);
  const statusCountsMatch = doReportArtifactStatusCountsMatch(
    payload.statusCounts,
    computedSummary.statusCounts,
  );
  const expectedRecommendedActions = buildRecommendedActionsFromResults(results);
  const recommendedActionsMatch = areRecommendedActionsEqual(
    payload.recommendedActions,
    expectedRecommendedActions,
  );

  return Boolean(
    payload.totalChecked === computedSummary.totalChecked &&
      payload.failureCount === computedSummary.failureCount &&
      payload.overallPassed === computedSummary.overallPassed &&
      reportedStatusTotal === payload.totalChecked &&
      computedSummary.statusTotal === payload.totalChecked &&
      statusCountsMatch &&
      hasExactTargets &&
      hasUniqueResultPaths &&
      hasSortedResultPaths &&
      recommendedActionsMatch,
  );
}
