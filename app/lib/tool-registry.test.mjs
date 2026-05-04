import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAdjacentTools,
  tools,
} from './tool-registry.ts';

test('tools are ordered by expected usage frequency', () => {
  const expectedTopFive = [
    'json-formatter',
    'base64-converter',
    'jwt-decoder',
    'js-beautifier',
    'curl-to-code',
  ];

  assert.deepEqual(
    tools.slice(0, expectedTopFive.length).map((tool) => tool.id),
    expectedTopFive,
  );
});

test('includes the curl-to-code generator as a browser-local code utility', () => {
  const curlTool = tools.find((tool) => tool.id === 'curl-to-code');

  assert.equal(curlTool?.path, '/converters/curl-to-code');
  assert.equal(curlTool?.category, 'code-docs');
  assert.equal(curlTool?.group, '코드');
});

test('includes the code-to-curl generator as a browser-local code utility', () => {
  const codeToCurlTool = tools.find((tool) => tool.id === 'code-to-curl');

  assert.equal(codeToCurlTool?.path, '/converters/code-to-curl');
  assert.equal(codeToCurlTool?.category, 'code-docs');
  assert.equal(codeToCurlTool?.group, '코드');
});

test('tool paths are unique and point to converter pages', () => {
  const paths = tools.map((tool) => tool.path);

  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every((path) => path.startsWith('/converters/')));
});

test('includes the JWT decoder as a browser-local security tool', () => {
  const jwtTool = tools.find((tool) => tool.id === 'jwt-decoder');

  assert.equal(jwtTool?.path, '/converters/jwt-decoder');
  assert.equal(jwtTool?.category, 'security-network');
  assert.equal(jwtTool?.group, '보안');
});

test('includes the regex tester as a browser-local code utility', () => {
  const regexTool = tools.find((tool) => tool.id === 'regex-tester');

  assert.equal(regexTool?.path, '/converters/regex-tester');
  assert.equal(regexTool?.category, 'code-docs');
  assert.equal(regexTool?.group, '코드');
});

test('includes the env validator as a browser-local code utility', () => {
  const envTool = tools.find((tool) => tool.id === 'env-validator');

  assert.equal(envTool?.path, '/converters/env-validator');
  assert.equal(envTool?.category, 'code-docs');
  assert.equal(envTool?.group, '코드');
});

test('finds previous and next tools around the active tool', () => {
  const adjacent = getAdjacentTools('timestamp-converter');

  assert.equal(adjacent.previous?.id, 'code-to-curl');
  assert.equal(adjacent.next?.id, 'regex-tester');
});

test('wraps adjacent navigation at the beginning and end of the tool list', () => {
  const first = getAdjacentTools('json-formatter');
  const last = getAdjacentTools('ip-geolocation');

  assert.equal(first.previous?.id, 'ip-geolocation');
  assert.equal(first.next?.id, 'base64-converter');
  assert.equal(last.previous?.id, 'base64-to-image');
  assert.equal(last.next?.id, 'json-formatter');
});
