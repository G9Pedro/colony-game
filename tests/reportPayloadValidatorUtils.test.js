import test from 'node:test';
import assert from 'node:assert/strict';
import {
  areNormalizedJsonValuesEqual,
  isNonNegativeInteger,
  isNullableFiniteNumber,
  isNullableString,
  isPlainRecord,
  isRecordOfNonNegativeFiniteNumbers,
  isRecordOfNullableStrings,
  isRecordOfNumbers,
  isRecordOfStrings,
  isSnippetObjectParityValid,
  normalizeJsonValue,
  parseExportedConstSnippetObject,
  roundToFour,
  roundToTwo,
} from '../src/game/reportPayloadValidatorUtils.js';

test('plain/nullable/number utility guards behave as expected', () => {
  assert.equal(isPlainRecord({ a: 1 }), true);
  assert.equal(isPlainRecord([]), false);
  assert.equal(isNullableString(null), true);
  assert.equal(isNullableString('x'), true);
  assert.equal(isNullableString(1), false);
  assert.equal(isNullableFiniteNumber(null), true);
  assert.equal(isNullableFiniteNumber(1.5), true);
  assert.equal(isNullableFiniteNumber(Number.NaN), false);
  assert.equal(isNonNegativeInteger(0), true);
  assert.equal(isNonNegativeInteger(3), true);
  assert.equal(isNonNegativeInteger(-1), false);
  assert.equal(isNonNegativeInteger(1.2), false);
});

test('round helpers apply deterministic precision', () => {
  assert.equal(roundToTwo(1.236), 1.24);
  assert.equal(roundToFour(1.23654), 1.2365);
});

test('normalizeJsonValue sorts object keys recursively', () => {
  const normalized = normalizeJsonValue({
    b: { y: 2, x: 1 },
    a: [{ z: 1, y: 0 }],
  });
  assert.deepEqual(normalized, {
    a: [{ y: 0, z: 1 }],
    b: { x: 1, y: 2 },
  });
});

test('areNormalizedJsonValuesEqual ignores key order but not value differences', () => {
  assert.equal(
    areNormalizedJsonValuesEqual(
      { b: { y: 2, x: 1 }, a: 1 },
      { a: 1, b: { x: 1, y: 2 } },
    ),
    true,
  );
  assert.equal(areNormalizedJsonValuesEqual({ a: 1 }, { a: 2 }), false);
});

test('snippet parsing/parity validates exported const object payloads', () => {
  const snippet = 'export const EXPECTED = {"b":2,"a":1};\n';
  const parsed = parseExportedConstSnippetObject(snippet, 'EXPECTED');
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, { b: 2, a: 1 });

  assert.equal(
    isSnippetObjectParityValid({
      snippet,
      constName: 'EXPECTED',
      expectedValue: { a: 1, b: 2 },
    }),
    true,
  );
  assert.equal(
    isSnippetObjectParityValid({
      snippet,
      constName: 'EXPECTED',
      expectedValue: { a: 1, b: 3 },
    }),
    false,
  );

  assert.equal(parseExportedConstSnippetObject('export const EXPECTED = 5;', 'EXPECTED').ok, false);
  assert.equal(parseExportedConstSnippetObject('const EXPECTED = {};', 'EXPECTED').ok, false);
});

test('record validators enforce expected value constraints', () => {
  assert.equal(isRecordOfNumbers({ ok: 1, error: 0 }), true);
  assert.equal(isRecordOfNumbers({ ok: -1 }), false);
  assert.equal(isRecordOfNullableStrings({ a: 'x', b: null }), true);
  assert.equal(isRecordOfNullableStrings({ a: 1 }), false);
  assert.equal(isRecordOfStrings({ a: 'x', b: 'y' }), true);
  assert.equal(isRecordOfStrings({ a: '' }), false);
  assert.equal(isRecordOfNonNegativeFiniteNumbers({ a: 0, b: 1.5 }), true);
  assert.equal(isRecordOfNonNegativeFiniteNumbers({ a: -1 }), false);
});
