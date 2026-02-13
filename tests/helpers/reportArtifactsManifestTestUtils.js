import { getReportArtifactTargetPath } from '../../src/game/reportArtifactsManifest.js';

export function requireReportArtifactPath(kind) {
  const path = getReportArtifactTargetPath(kind);
  if (typeof path !== 'string' || path.length === 0) {
    throw new Error(`Expected report artifact path for kind "${kind}".`);
  }
  return path;
}
