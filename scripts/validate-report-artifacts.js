import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  buildReportArtifactsValidationMarkdown,
  evaluateReportArtifactEntries,
  REPORT_ARTIFACT_TARGETS,
} from '../src/game/reportArtifactsValidation.js';
import {
  REPORT_KINDS,
  validateReportPayloadByKind,
  withReportMeta,
} from '../src/game/reportPayloadValidators.js';

const outputPath =
  process.env.REPORTS_VALIDATE_OUTPUT_PATH ?? 'reports/report-artifacts-validation.json';
const markdownOutputPath =
  process.env.REPORTS_VALIDATE_OUTPUT_MD_PATH ?? 'reports/report-artifacts-validation.md';

const entries = [];
for (const target of REPORT_ARTIFACT_TARGETS) {
  try {
    const payloadText = await readFile(target.path, 'utf-8');
    entries.push({
      path: target.path,
      kind: target.kind,
      payload: JSON.parse(payloadText),
    });
  } catch (error) {
    entries.push({
      path: target.path,
      kind: target.kind,
      errorType: error instanceof SyntaxError ? 'invalid-json' : 'error',
      message: error.message,
    });
  }
}

const baseReport = evaluateReportArtifactEntries(entries);
const report = withReportMeta(REPORT_KINDS.reportArtifactsValidation, baseReport);
const metaValidation = validateReportPayloadByKind(REPORT_KINDS.reportArtifactsValidation, report);
if (!metaValidation.ok) {
  console.error(`Unable to build valid report artifact payload: ${metaValidation.reason}`);
  process.exit(1);
}
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
const markdown = buildReportArtifactsValidationMarkdown(report);
await writeFile(markdownOutputPath, markdown, 'utf-8');

report.results.forEach((result) => {
  if (result.ok) {
    console.log(`[ok] ${result.path}: kind=${result.kind}`);
    return;
  }
  console.error(`[${result.status}] ${result.path}: ${result.message}`);
});

console.log(
  `Report artifact validation summary: total=${report.totalChecked}, failed=${report.failureCount}`,
);
console.log(`Report artifact validation report written to: ${outputPath}`);
console.log(`Report artifact validation markdown written to: ${markdownOutputPath}`);

if (!report.overallPassed) {
  process.exit(1);
}
