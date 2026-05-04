import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RESPONSIVE_OUTPUT_FILES = [
  '../components/request-converter-workbench.tsx',
  '../converters/env-validator/page.tsx',
  '../converters/jwt-decoder/page.tsx',
  '../converters/random-token-generator/page.tsx',
  '../converters/regex-tester/page.tsx',
];

test('developer result areas opt into responsive overflow containment', () => {
  const globalStyles = readFileSync(resolve(import.meta.dirname, '../globals.css'), 'utf8');

  assert.match(globalStyles, /\.result-output\b/, 'global result output utility should exist');
  assert.match(globalStyles, /overflow-wrap:\s*anywhere/, 'long generated values should be allowed to wrap');
  assert.match(globalStyles, /max-width:\s*100%/, 'result blocks should not exceed their container');

  for (const file of RESPONSIVE_OUTPUT_FILES) {
    const source = readFileSync(resolve(import.meta.dirname, file), 'utf8');

    assert.match(source, /result-output/, `${file} should mark output blocks with result-output`);
    assert.match(source, /min-w-0/, `${file} should allow grid or flex result columns to shrink`);
  }
});
