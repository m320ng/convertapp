import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateCodeFromCurl,
  getCurlToCodeLanguages,
} from './curl-to-code.ts';

const SAMPLE_CURL = String.raw`curl -X POST "https://api.example.com/users?active=true" \
  -H "Authorization: Bearer secret-token" \
  -H "Content-Type: application/json" \
  --data-raw '{"name":"홍길동"}' \
  --location --compressed`;

test('generates browser fetch code with configurable indentation and sensitive placeholders', () => {
  const result = generateCodeFromCurl(SAMPLE_CURL, {
    language: 'javascript-fetch',
    indentSize: 2,
    timeoutSeconds: 15,
    includeTimeout: true,
    includeComments: true,
    redactSensitiveValues: true,
  });

  assert.equal(result.languageLabel, 'JavaScript fetch');
  assert.match(result.code, /const controller = new AbortController\(\);/);
  assert.match(result.code, /Authorization': '<AUTHORIZATION_VALUE>'/);
  assert.match(result.code, /body: '{"name":"홍길동"}'/);
  assert.match(result.code, /signal: controller.signal/);
  assert.match(result.summary, /POST/);
  assert.equal(result.warnings.some((warning) => warning.includes('Authorization')), true);
});

test('generates Python requests code with JSON body handling and timeout option', () => {
  const result = generateCodeFromCurl(SAMPLE_CURL, {
    language: 'python-requests',
    indentSize: 4,
    includeTimeout: true,
    timeoutSeconds: 10,
    redactSensitiveValues: false,
  });

  assert.match(result.code, /import requests/);
  assert.match(result.code, /method="POST"/);
  assert.match(result.code, /payload = \{\n {4}"name": "홍길동"\n\}/);
  assert.match(result.code, /json=payload/);
  assert.match(result.code, /timeout=10/);
  assert.match(result.code, /allow_redirects=True/);
  assert.doesNotMatch(result.code, /<AUTHORIZATION_VALUE>/);
});

test('generates PHP cURL code with custom headers and body', () => {
  const result = generateCodeFromCurl('curl -X PUT -H "X-Api-Key: abc123" -d status=done https://api.example.com/tasks/1', {
    language: 'php-curl',
    indentSize: 4,
    includeTimeout: true,
    timeoutSeconds: 20,
    redactSensitiveValues: true,
  });

  assert.match(result.code, /curl_init\('https:\/\/api\.example\.com\/tasks\/1'\)/);
  assert.match(result.code, /CURLOPT_CUSTOMREQUEST => 'PUT'/);
  assert.match(result.code, /'X-Api-Key: <X_API_KEY_VALUE>'/);
  assert.match(result.code, /CURLOPT_POSTFIELDS => 'status=done'/);
  assert.match(result.code, /CURLOPT_TIMEOUT => 20/);
});

test('honors code generation options for Node fetch without adding disabled helpers', () => {
  const result = generateCodeFromCurl('curl -H "Accept: application/json" https://api.example.com/status', {
    language: 'node-fetch',
    indentSize: 4,
    includeTimeout: false,
    includeComments: false,
    includeAsyncWrapper: true,
  });

  assert.equal(result.languageLabel, 'Node.js fetch');
  assert.match(result.code, /async function runRequest\(\)/);
  assert.match(result.code, / {4}const response = await fetch/);
  assert.doesNotMatch(result.code, /AbortController/);
  assert.doesNotMatch(result.code, /ConvertApp에서 생성한 코드/);
});

test('returns clear Korean errors for invalid generation options', () => {
  assert.throws(
    () => generateCodeFromCurl('curl https://api.example.com', {
      language: 'ruby-net-http',
    }),
    /지원하지 않는 대상 언어입니다/,
  );

  assert.throws(
    () => generateCodeFromCurl('curl https://api.example.com', {
      language: 'javascript-fetch',
      timeoutSeconds: 0,
    }),
    /타임아웃은 1초 이상이어야 합니다/,
  );

  assert.throws(
    () =>
      generateCodeFromCurl('wget https://api.example.com', {
        language: 'javascript-fetch',
      }),
    /명령어는 curl로 시작해야 합니다/,
  );
});

test('exposes supported target languages for the UI', () => {
  assert.deepEqual(
    getCurlToCodeLanguages().map((language) => language.id),
    ['javascript-fetch', 'node-fetch', 'python-requests', 'php-curl'],
  );
});
