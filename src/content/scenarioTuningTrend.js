function round(value) {
  return Number(value.toFixed(2));
}

function asFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function indexScenariosById(dashboard) {
  const map = new Map();
  for (const scenario of dashboard?.scenarios ?? []) {
    if (!scenario || typeof scenario.id !== 'string') {
      continue;
    }
    map.set(scenario.id, scenario);
  }
  return map;
}

function buildScenarioIds(currentScenarios, baselineScenarios, baselineSignatures) {
  return Array.from(
    new Set([
      ...currentScenarios.keys(),
      ...baselineScenarios.keys(),
      ...Object.keys(baselineSignatures ?? {}),
    ]),
  ).sort((a, b) => a.localeCompare(b));
}

function resolveStatus({ hasCurrent, hasBaseline, signatureChanged, intensityChanged }) {
  if (hasCurrent && hasBaseline) {
    return signatureChanged || intensityChanged ? 'changed' : 'unchanged';
  }
  if (hasCurrent) {
    return 'added';
  }
  return 'removed';
}

export function buildScenarioTuningTrendReport({
  currentDashboard,
  baselineDashboard = null,
  baselineSignatures = {},
  comparisonSource = 'dashboard',
  baselineReference = null,
}) {
  const currentScenarios = indexScenariosById(currentDashboard);
  const baselineScenarios = indexScenariosById(baselineDashboard);
  const scenarioIds = buildScenarioIds(currentScenarios, baselineScenarios, baselineSignatures);

  const scenarios = scenarioIds.map((scenarioId) => {
    const currentScenario = currentScenarios.get(scenarioId);
    const baselineScenario = baselineScenarios.get(scenarioId);
    const currentSignature = currentScenario?.signature ?? null;
    const baselineSignature = baselineScenario?.signature ?? baselineSignatures?.[scenarioId] ?? null;
    const currentIntensity = asFiniteNumber(currentScenario?.totalAbsDeltaPercent);
    const baselineIntensity = asFiniteNumber(baselineScenario?.totalAbsDeltaPercent);
    const signatureChanged = currentSignature !== baselineSignature;
    const intensityDelta =
      currentIntensity !== null && baselineIntensity !== null
        ? round(currentIntensity - baselineIntensity)
        : null;
    const intensityChanged = intensityDelta !== null && intensityDelta !== 0;
    const status = resolveStatus({
      hasCurrent: Boolean(currentScenario),
      hasBaseline: baselineSignature !== null || Boolean(baselineScenario),
      signatureChanged,
      intensityChanged,
    });

    return {
      scenarioId,
      status,
      changed: status !== 'unchanged',
      signatureChanged,
      currentSignature,
      baselineSignature,
      currentTotalAbsDeltaPercent: currentIntensity,
      baselineTotalAbsDeltaPercent: baselineIntensity,
      deltaTotalAbsDeltaPercent: intensityDelta,
    };
  });

  const changedScenarios = scenarios.filter((scenario) => scenario.changed);
  return {
    comparisonSource,
    baselineReference,
    hasBaselineDashboard: baselineScenarios.size > 0,
    baselineScenarioCount: baselineScenarios.size,
    scenarioCount: scenarios.length,
    changedCount: changedScenarios.length,
    unchangedCount: scenarios.length - changedScenarios.length,
    hasChanges: changedScenarios.length > 0,
    scenarios,
    changedScenarioIds: changedScenarios.map((scenario) => scenario.scenarioId),
  };
}

function formatSignedDelta(value) {
  if (value === null) {
    return 'n/a';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function buildScenarioTuningTrendMarkdown(report) {
  const lines = [
    '# Scenario Tuning Trend',
    '',
    `- Comparison Source: ${report.comparisonSource}`,
    `- Baseline Reference: ${report.baselineReference ?? 'none'}`,
    `- Baseline Dashboard Available: ${report.hasBaselineDashboard ? 'yes' : 'no'}`,
    `- Scenarios Compared: ${report.scenarioCount}`,
    `- Changed: ${report.changedCount}`,
    `- Unchanged: ${report.unchangedCount}`,
    '',
    '## Changed Scenarios',
    '',
  ];

  if (!report.hasChanges) {
    lines.push('- No scenario tuning changes detected.', '');
    return `${lines.join('\n')}\n`;
  }

  lines.push('| Scenario | Status | Signature | Intensity Δ |');
  lines.push('| --- | --- | --- | --- |');

  for (const scenario of report.scenarios) {
    if (!scenario.changed) {
      continue;
    }
    const signatureText =
      scenario.baselineSignature === null && scenario.currentSignature !== null
        ? `added ${scenario.currentSignature}`
        : scenario.currentSignature === null && scenario.baselineSignature !== null
          ? `removed ${scenario.baselineSignature}`
          : `${scenario.baselineSignature} → ${scenario.currentSignature}`;
    lines.push(
      `| ${scenario.scenarioId} | ${scenario.status} | ${signatureText} | ${formatSignedDelta(scenario.deltaTotalAbsDeltaPercent)} |`,
    );
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}
