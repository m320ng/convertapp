import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDefaultLanguageForDirection,
  getRequestConverterDirections,
  getRequestConverterLanguageOptions,
} from './request-converter-ui.ts';

test('exposes both request converter directions in UI order', () => {
  assert.deepEqual(
    getRequestConverterDirections().map((direction) => direction.id),
    ['curl-to-code', 'code-to-curl'],
  );
});

test('returns direction-specific default languages', () => {
  assert.equal(getDefaultLanguageForDirection('curl-to-code'), 'javascript-fetch');
  assert.equal(getDefaultLanguageForDirection('code-to-curl'), 'javascript-fetch');
});

test('returns language options for each direction', () => {
  assert.deepEqual(
    getRequestConverterLanguageOptions('curl-to-code').map((language) => language.id),
    ['javascript-fetch', 'node-fetch', 'python-requests', 'php-curl'],
  );
  assert.deepEqual(
    getRequestConverterLanguageOptions('code-to-curl').map((language) => language.id),
    ['javascript-fetch', 'python-requests', 'http'],
  );
});
