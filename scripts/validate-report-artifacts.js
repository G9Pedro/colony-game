import { readFile } from 'node:fs/promises';
import {
  buildReportArtifactsValidationMarkdown,
  evaluateReportArtifactEntries,
  REPORT_ARTIFACT_TARGETS,
} from '../src/game/reportArtifactsValidation.js';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import {
  buildValidatedReportPayload,
  writeJsonArtifact,
  writeTextArtifact,
} from './reportPayloadOutput.js';

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
const report = buildValidatedReportPayload(
  REPORT_KINDS.reportArtifactsValidation,
  baseReport,
  'report artifact validation',
);
await writeJsonArtifact(outputPath, report);
const markdown = buildReportArtifactsValidationMarkdown(report);
await writeTextArtifact(markdownOutputPath, markdown);

report.results.forEach((result) => {
  if (result.ok) {
    console.log(`[ok] ${result.path}: kind=${result.kind}`);
    return;
  }
  console.error(`[${result.status}] ${result.path}: ${result.message}`);
  if (result.recommendedCommand) {
    console.error(`  remediation: run "${result.recommendedCommand}"`);
  }
});

console.log(
  `Report artifact validation summary: total=${report.totalChecked}, failed=${report.failureCount}`,
);
console.log(`Report artifact validation report written to: ${outputPath}`);
console.log(`Report artifact validation markdown written to: ${markdownOutputPath}`);

if (!report.overallPassed) {
  process.exit(1);
}
