import { REPORT_KINDS, withReportMeta } from '../../src/game/reportPayloadMeta.js';
import {
  buildReportArtifactResultStatistics,
  buildRecommendedActionsFromResults,
  REPORT_ARTIFACT_STATUSES,
} from '../../src/game/reportArtifactValidationPayloadHelpers.js';
import { REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH } from '../../src/game/reportArtifactsManifest.js';

const REPORT_ARTIFACT_TARGET_PATHS = new Set(
  REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH.map((target) => target.path),
);

function assertKnownReportArtifactOverridePaths(overridesByPath) {
  for (const overridePath of Object.keys(overridesByPath ?? {})) {
    if (!REPORT_ARTIFACT_TARGET_PATHS.has(overridePath)) {
      throw new Error(`Unknown report artifact override path "${overridePath}".`);
    }
  }
}

export function buildReportArtifactValidationResults(overridesByPath = {}) {
  assertKnownReportArtifactOverridePaths(overridesByPath);
  return REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH.map((target) => {
    const overrides = overridesByPath[target.path] ?? {};
    return {
      path: target.path,
      kind: target.kind,
      status: REPORT_ARTIFACT_STATUSES.ok,
      ok: true,
      message: null,
      recommendedCommand: null,
      ...overrides,
    };
  });
}

export function buildValidReportArtifactsValidationPayload(overrides = {}) {
  const results = overrides.results ?? buildReportArtifactValidationResults();
  const summary = buildReportArtifactResultStatistics(results);
  const recommendedActions =
    overrides.recommendedActions ?? buildRecommendedActionsFromResults(results);

  return withReportMeta(REPORT_KINDS.reportArtifactsValidation, {
    overallPassed: summary.overallPassed,
    failureCount: summary.failureCount,
    totalChecked: summary.totalChecked,
    statusCounts: summary.statusCounts,
    recommendedActions,
    results,
    ...overrides,
  });
}

export function buildReportArtifactsValidationPayloadFixture({
  resultOverridesByPath = {},
  payloadOverrides = {},
} = {}) {
  return buildValidReportArtifactsValidationPayload({
    results: buildReportArtifactValidationResults(resultOverridesByPath),
    ...payloadOverrides,
  });
}
