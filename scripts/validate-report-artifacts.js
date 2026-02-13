import {
  buildReportArtifactsValidationMarkdown,
  evaluateReportArtifactEntries,
  REPORT_ARTIFACT_TARGETS,
} from '../src/game/reportArtifactsValidation.js';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import {
  createScriptDiagnosticEmitter,
  REPORT_DIAGNOSTIC_CODES,
} from './reportDiagnostics.js';
import {
  getReportArtifactStatusDiagnosticCode,
  readJsonArtifact,
  toArtifactValidationEntry,
} from './reportPayloadInput.js';
import {
  buildValidatedReportPayload,
  writeJsonArtifact,
  writeTextArtifact,
} from './reportPayloadOutput.js';

const outputPath =
  process.env.REPORTS_VALIDATE_OUTPUT_PATH ?? 'reports/report-artifacts-validation.json';
const markdownOutputPath =
  process.env.REPORTS_VALIDATE_OUTPUT_MD_PATH ?? 'reports/report-artifacts-validation.md';
const DIAGNOSTIC_SCRIPT = 'reports:validate';
const emitDiagnostic = createScriptDiagnosticEmitter(DIAGNOSTIC_SCRIPT);

const entries = [];
for (const target of REPORT_ARTIFACT_TARGETS) {
  const readResult = await readJsonArtifact(target.path);
  entries.push(
    toArtifactValidationEntry({
      path: target.path,
      kind: target.kind,
      readResult,
    }),
  );
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
  const diagnosticCode = getReportArtifactStatusDiagnosticCode(result.status);
  const diagnosticSuffix = diagnosticCode ? ` (code=${diagnosticCode})` : '';
  console.error(`[${result.status}] ${result.path}: ${result.message}${diagnosticSuffix}`);
  emitDiagnostic({
    level: 'error',
    code: diagnosticCode ?? REPORT_DIAGNOSTIC_CODES.artifactReadError,
    message: result.message,
    context: {
      path: result.path,
      kind: result.kind,
      status: result.status,
      recommendedCommand: result.recommendedCommand ?? null,
    },
  });
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
