export function isPlainRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function isNullableString(value) {
  return value === null || typeof value === 'string';
}

export function isNullableFiniteNumber(value) {
  return value === null || Number.isFinite(value);
}

export function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

export function roundToTwo(value) {
  return Number(value.toFixed(2));
}

export function roundToFour(value) {
  return Number(value.toFixed(4));
}

export function normalizeJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }
  if (!isPlainRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, normalizeJsonValue(value[key])]),
  );
}

export function areNormalizedJsonValuesEqual(left, right) {
  return JSON.stringify(normalizeJsonValue(left)) === JSON.stringify(normalizeJsonValue(right));
}

export function parseExportedConstSnippetObject(snippet, constName) {
  if (typeof snippet !== 'string' || snippet.length === 0) {
    return { ok: false, value: null };
  }

  const escapedConstName = constName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `^\\s*export\\s+const\\s+${escapedConstName}\\s*=\\s*([\\s\\S]+?)\\s*;\\s*$`,
  );
  const match = snippet.match(pattern);
  if (!match) {
    return { ok: false, value: null };
  }

  try {
    const value = JSON.parse(match[1]);
    if (!isPlainRecord(value)) {
      return { ok: false, value: null };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, value: null };
  }
}

export function isSnippetObjectParityValid({ snippet, constName, expectedValue }) {
  const parsed = parseExportedConstSnippetObject(snippet, constName);
  if (!parsed.ok) {
    return false;
  }
  return areNormalizedJsonValuesEqual(parsed.value, expectedValue);
}

export function isRecordOfNumbers(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((entry) => Number.isInteger(entry) && entry >= 0);
}

export function isRecordOfNullableStrings(value) {
  if (!isPlainRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => isNullableString(entry));
}

export function isRecordOfStrings(value) {
  if (!isPlainRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === 'string' && entry.length > 0);
}

export function isRecordOfNonNegativeFiniteNumbers(value) {
  if (!isPlainRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => Number.isFinite(entry) && entry >= 0);
}
