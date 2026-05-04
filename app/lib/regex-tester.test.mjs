import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRegexFlagValue,
  regexFlagOptions,
  safeTestRegex,
  testRegex,
} from './regex-tester.ts';

test('builds regex flags from selectable options in a stable order', () => {
  assert.equal(
    getRegexFlagValue({
      global: true,
      ignoreCase: true,
      multiline: true,
      dotAll: true,
      unicode: true,
      sticky: true,
    }),
    'gimsuy',
  );
});

test('tests a pattern against text and returns global matches with indices', () => {
  const result = testRegex({
    pattern: 'hello',
    text: 'Hello world\nhello app',
    flags: {
      global: true,
      ignoreCase: true,
      multiline: false,
      dotAll: false,
      unicode: false,
      sticky: false,
    },
  });

  assert.equal(result.flags, 'gi');
  assert.equal(result.hasMatch, true);
  assert.deepEqual(
    result.matches.map((match) => ({
      value: match.value,
      index: match.index,
      endIndex: match.endIndex,
    })),
    [
      { value: 'Hello', index: 0, endIndex: 5 },
      { value: 'hello', index: 12, endIndex: 17 },
    ],
  );
});

test('returns clear Korean validation errors for missing and invalid pattern input', () => {
  assert.throws(
    () =>
      testRegex({
        pattern: '',
        text: 'sample',
        flags: regexFlagOptions,
      }),
    /정규식 패턴을 입력해주세요/,
  );

  assert.throws(
    () =>
      testRegex({
        pattern: '(',
        text: 'sample',
        flags: regexFlagOptions,
      }),
    /정규식 패턴이 올바르지 않습니다/,
  );
});

test('returns clear Korean validation errors for unsupported flag input', () => {
  assert.throws(
    () =>
      testRegex({
        pattern: 'hello',
        text: 'hello',
        flags: null,
      }),
    /정규식 플래그 설정을 확인해주세요/,
  );
});

test('returns a non-throwing Korean error result for invalid regex patterns', () => {
  assert.doesNotThrow(() =>
    safeTestRegex({
      pattern: '(',
      text: 'sample',
      flags: regexFlagOptions,
    }),
  );

  const result = safeTestRegex({
    pattern: '(',
    text: 'sample',
    flags: regexFlagOptions,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, '정규식 패턴이 올바르지 않습니다. 괄호, 대괄호, 이스케이프 문자를 확인해주세요.');
});
