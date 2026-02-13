function round(value) {
  return Number(value.toFixed(4));
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectKeys(item));
  }
  if (!isPlainObject(value)) {
    return value;
  }

  const sorted = {};
  Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sorted[key] = sortObjectKeys(value[key]);
    });
  return sorted;
}

function sanitizeMultiplierMap(map = {}) {
  if (!map || typeof map !== 'object') {
    return {};
  }

  return Object.entries(map).reduce((acc, [key, value]) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return acc;
    }
    const roundedValue = round(value);
    if (roundedValue === 1) {
      return acc;
    }
    acc[key] = roundedValue;
    return acc;
  }, {});
}

export function buildCanonicalScenarioTuning(scenario = {}) {
  return sortObjectKeys({
    resource: sanitizeMultiplierMap(scenario.productionMultipliers?.resource ?? {}),
    job: sanitizeMultiplierMap(scenario.productionMultipliers?.job ?? {}),
    priority: sanitizeMultiplierMap(scenario.jobPriorityMultipliers ?? {}),
  });
}

export function buildScenarioTuningSignature(scenario) {
  const canonical = buildCanonicalScenarioTuning(scenario);
  const text = JSON.stringify(canonical);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildScenarioTuningSignatureMap(scenarios) {
  return Object.fromEntries(
    Object.entries(scenarios)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([scenarioId, scenario]) => [scenarioId, buildScenarioTuningSignature(scenario)]),
  );
}
