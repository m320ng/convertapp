import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  COPY_RESULT_EMPTY_MESSAGE,
  COPY_RESULT_ERROR_MESSAGE,
  COPY_RESULT_SUCCESS_MESSAGE,
  hasCopyResultValue,
  getCopyResultFeedback,
  getCopyResultPayload,
} from './copy-result-action.ts';

test('prepares non-empty result text for clipboard copy', () => {
  const payload = getCopyResultPayload('{"ok":true}');

  assert.deepEqual(payload, {
    ok: true,
    text: '{"ok":true}',
  });
});

test('returns a clear Korean feedback state when there is no result to copy', () => {
  const payload = getCopyResultPayload('');

  assert.deepEqual(payload, {
    ok: false,
    feedback: {
      status: 'error',
      message: COPY_RESULT_EMPTY_MESSAGE,
    },
  });
});

test('marks copy actions unavailable until result text exists', () => {
  assert.equal(hasCopyResultValue('변환 결과'), true);
  assert.equal(hasCopyResultValue('0'), true);
  assert.equal(hasCopyResultValue(''), false);
  assert.equal(hasCopyResultValue(null), false);
  assert.equal(hasCopyResultValue(undefined), false);
});

test('copy result button disables itself when static result text is empty', () => {
  const source = readFileSync(
    resolve(import.meta.dirname, '../components/copy-result-action.tsx'),
    'utf8',
  );

  assert.match(source, /hasCopyResultValue/, 'component should derive availability from static values');
  assert.match(
    source,
    /disabled=\{disabled \|\| !hasCopyResultValue\(value\)\}/,
    'button should be disabled when no static result exists',
  );
});

test('legacy direct copy buttons are disabled while their text area value is empty', () => {
  const expectations = [
    {
      file: '../converters/base64-converter/page.tsx',
      disabledPatterns: [/disabled=\{!input\}/, /disabled=\{!output\}/],
    },
    {
      file: '../converters/markdown-viewer/page.tsx',
      disabledPatterns: [/disabled=\{!markdown\}/],
    },
  ];

  for (const expectation of expectations) {
    const source = readFileSync(resolve(import.meta.dirname, expectation.file), 'utf8');

    for (const disabledPattern of expectation.disabledPatterns) {
      assert.match(
        source,
        disabledPattern,
        `${expectation.file} should disable copy buttons without text`,
      );
    }
  }
});

test('builds Korean success and error feedback messages for reusable copy actions', () => {
  assert.deepEqual(getCopyResultFeedback('success'), {
    status: 'success',
    message: COPY_RESULT_SUCCESS_MESSAGE,
  });

  assert.deepEqual(getCopyResultFeedback('error'), {
    status: 'error',
    message: COPY_RESULT_ERROR_MESSAGE,
  });
});

test('new structured or formatted developer tools render copy result actions for their outputs', () => {
  const toolFiles = [
    '../converters/regex-tester/page.tsx',
    '../converters/env-validator/page.tsx',
    '../converters/random-token-generator/page.tsx',
    '../converters/jwt-decoder/page.tsx',
    '../components/request-converter-workbench.tsx',
  ];

  for (const toolFile of toolFiles) {
    const source = readFileSync(resolve(import.meta.dirname, toolFile), 'utf8');

    assert.match(source, /CopyResultAction/, `${toolFile} should use CopyResultAction`);
    assert.doesNotMatch(
      source,
      /navigator\.clipboard\.writeText/,
      `${toolFile} should not maintain a separate clipboard writer`,
    );
  }
});
