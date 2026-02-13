import { REPORT_KINDS, withReportMeta } from '../../src/game/reportPayloadMeta.js';
import {
  buildReportArtifactResultStatistics,
  buildRecommendedActionsFromResults,
  REPORT_ARTIFACT_STATUSES,
} from '../../src/game/reportArtifactValidationPayloadHelpers.js';
import {
  getReportArtifactRegenerationCommand,
  isKnownReportArtifactTargetPath,
  REPORT_ARTIFACT_TARGETS_SORTED_BY_PATH,
} from '../../src/game/reportArtifactsManifest.js';

function assertKnownReportArtifactOverridePaths(overridesByPath) {
  for (const overridePath of Object.keys(overridesByPath ?? {})) {
    if (!isKnownReportArtifactTargetPath(overridePath)) {
      throw new Error(`Unknown report artifact override path "${overridePath}".`);
    }
  }
}

function assertKnownReportArtifactPaths(paths = []) {
  for (const path of paths ?? []) {
    if (!isKnownReportArtifactTargetPath(path)) {
      throw new Error(`Unknown report artifact path "${path}".`);
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

export function buildFailingReportArtifactResultOverride(path, overrides = {}) {
  const {
    status = REPORT_ARTIFACT_STATUSES.error,
    message = 'fixture failure',
    recommendedCommand = getReportArtifactRegenerationCommand(path),
    ...rest
  } = overrides ?? {};

  return {
    ...rest,
    status,
    ok: false,
    message,
    recommendedCommand,
  };
}

export function buildReportArtifactsValidationPayloadFixture({
  resultOverridesByPath = {},
  omittedPaths = [],
  transformResults = null,
  payloadOverrides = {},
} = {}) {
  assertKnownReportArtifactPaths(omittedPaths);
  let results = buildReportArtifactValidationResults(resultOverridesByPath).filter(
    (result) => !omittedPaths.includes(result.path),
  );
  if (typeof transformResults === 'function') {
    const transformedResults = transformResults([...results]);
    if (!Array.isArray(transformedResults)) {
      throw new Error('transformResults must return an array of report artifact results.');
    }
    results = transformedResults;
  }

  return buildValidReportArtifactsValidationPayload({
    results,
    ...payloadOverrides,
  });
}
