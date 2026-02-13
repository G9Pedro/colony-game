import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  isValidReportDiagnosticPayload,
  parseReportDiagnosticsFromText,
  createScriptDiagnosticEmitter,
  REPORT_DIAGNOSTIC_CODES,
} from './reportDiagnostics.js';
import { writeJsonArtifact, writeTextArtifact } from './reportPayloadOutput.js';
import {
  buildDiagnosticsSmokeSummary,
  isValidDiagnosticsSmokeSummaryPayload,
} from './reportDiagnosticsSmokeSummary.js';
import {
  buildDiagnosticsSmokeScenarios,
  setupDiagnosticsSmokeFixtureWorkspace,
} from './reportDiagnosticsSmokeScenarios.js';
import { buildDiagnosticsSmokeMarkdown } from './reportDiagnosticsSmokeMarkdown.js';

const execFileAsync = promisify(execFile);

const outputPath =
  process.env.REPORT_DIAGNOSTICS_SMOKE_OUTPUT_PATH ?? 'reports/report-diagnostics-smoke.json';
const markdownOutputPath =
  process.env.REPORT_DIAGNOSTICS_SMOKE_MD_OUTPUT_PATH ?? 'reports/report-diagnostics-smoke.md';
const runId = process.env.REPORT_DIAGNOSTICS_RUN_ID ?? `report-diagnostics-smoke-${Date.now()}`;
const emitDiagnostic = createScriptDiagnosticEmitter('diagnostics:smoke');

function collectDiagnostics(stdout = '', stderr = '') {
  return [...parseReportDiagnosticsFromText(stdout), ...parseReportDiagnosticsFromText(stderr)];
}

async function runNodeScript(scriptPath, { cwd, env }) {
  try {
    const result = await execFileAsync(process.execPath, [scriptPath], {
      cwd,
      env: {
        ...process.env,
        ...env,
      },
    });
    return {
      exitCode: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      exitCode: Number.isInteger(error?.code) ? error.code : 1,
      stdout: error?.stdout ?? '',
      stderr: error?.stderr ?? '',
    };
  }
}

function evaluateScenarioDiagnostics({
  name,
  expectedScript,
  expectedExitCode,
  expectedCodes,
  runResult,
  runIdValue,
}) {
  const diagnostics = collectDiagnostics(runResult.stdout, runResult.stderr);
  const errors = [];

  if (runResult.exitCode !== expectedExitCode) {
    errors.push(`Expected exit code ${expectedExitCode} but got ${runResult.exitCode}.`);
  }

  if (diagnostics.length === 0) {
    errors.push('No diagnostics emitted.');
  }

  const observedCodes = new Set();
  for (const diagnostic of diagnostics) {
    observedCodes.add(diagnostic.code);
    if (!isValidReportDiagnosticPayload(diagnostic)) {
      errors.push('Encountered invalid diagnostic payload.');
    }
    if (diagnostic.script !== expectedScript) {
      errors.push(
        `Unexpected diagnostic script "${diagnostic.script}" (expected "${expectedScript}").`,
      );
    }
    if (diagnostic.runId !== runIdValue) {
      errors.push(`Unexpected diagnostic runId "${diagnostic.runId}" (expected "${runIdValue}").`);
    }
  }

  for (const code of expectedCodes) {
    if (!observedCodes.has(code)) {
      errors.push(`Missing expected diagnostic code "${code}".`);
    }
  }

  return {
    name,
    expectedScript,
    expectedExitCode,
    actualExitCode: runResult.exitCode,
    diagnostics,
    observedCodes: [...observedCodes].sort((a, b) => a.localeCompare(b)),
    ok: errors.length === 0,
    errors,
  };
}

async function main() {
  const baseDirectory = await mkdtemp(path.join(tmpdir(), 'report-diagnostics-smoke-'));
  try {
    const fixtureWorkspace = await setupDiagnosticsSmokeFixtureWorkspace(baseDirectory);
    const scenarios = buildDiagnosticsSmokeScenarios({
      runId,
      fixtureWorkspace,
      runNodeScript,
    });

    const scenarioResults = [];
    for (const scenario of scenarios) {
      const runResult = await scenario.run();
      scenarioResults.push(
        evaluateScenarioDiagnostics({
          name: scenario.name,
          expectedScript: scenario.expectedScript,
          expectedExitCode: scenario.expectedExitCode,
          expectedCodes: scenario.expectedCodes,
          runResult,
          runIdValue: runId,
        }),
      );
    }

    const failedScenarios = scenarioResults.filter((result) => !result.ok);
    const summary = buildDiagnosticsSmokeSummary({
      runId,
      scenarioResults,
    });
    if (!isValidDiagnosticsSmokeSummaryPayload(summary)) {
      throw new Error('Diagnostics smoke summary payload failed validation.');
    }

    emitDiagnostic({
      level: summary.failedScenarioCount > 0 ? 'error' : 'info',
      code: REPORT_DIAGNOSTIC_CODES.diagnosticsSmokeRunSummary,
      message: 'Diagnostics smoke run completed.',
      context: {
        scenarioCount: summary.scenarioCount,
        failedScenarioCount: summary.failedScenarioCount,
        diagnosticsCount: summary.diagnosticsCount,
        outputPath,
        markdownOutputPath,
      },
    });

    await writeJsonArtifact(outputPath, summary);
    await writeTextArtifact(markdownOutputPath, buildDiagnosticsSmokeMarkdown(summary));

    console.log(
      `Diagnostics smoke summary: scenarios=${summary.scenarioCount}, failed=${summary.failedScenarioCount}, diagnostics=${summary.diagnosticsCount}`,
    );
    console.log(`Diagnostics smoke report written to: ${outputPath}`);
    console.log(`Diagnostics smoke markdown report written to: ${markdownOutputPath}`);

    if (failedScenarios.length > 0) {
      failedScenarios.forEach((scenario) => {
        scenario.errors.forEach((error) => {
          console.error(`[diagnostics-smoke] ${scenario.name}: ${error}`);
        });
      });
      process.exit(1);
    }
  } finally {
    await rm(baseDirectory, { recursive: true, force: true });
  }
}

await main();
