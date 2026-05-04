import test from 'node:test';
import assert from 'node:assert/strict';

import {
  convertCodeToCurl,
  getCodeToCurlInputLanguages,
} from './code-to-curl.ts';

const FETCH_SNIPPET = `await fetch("https://api.example.com/users?active=true", {
  method: "POST",
  headers: {
    "Authorization": "Bearer secret-token",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ name: "홍길동", role: "admin" })
});`;

test('converts JavaScript fetch snippets to curl with JSON body and redacted headers', () => {
  const result = convertCodeToCurl(FETCH_SNIPPET, {
    language: 'javascript-fetch',
    multiline: true,
    includeCompressed: true,
    followRedirects: true,
    redactSensitiveValues: true,
  });

  assert.equal(result.languageLabel, 'JavaScript fetch');
  assert.match(result.command, /^curl \\/);
  assert.match(result.command, /-X POST/);
  assert.match(result.command, /'https:\/\/api\.example\.com\/users\?active=true'/);
  assert.match(result.command, /-H 'Authorization: <AUTHORIZATION_VALUE>'/);
  assert.match(result.command, /-H 'Content-Type: application\/json'/);
  assert.match(result.command, /--data-raw '\{"name":"홍길동","role":"admin"\}'/);
  assert.match(result.command, /--location/);
  assert.match(result.command, /--compressed/);
  assert.equal(result.summary, 'POST https://api.example.com/users?active=true');
  assert.equal(result.warnings.some((warning) => warning.includes('Authorization')), true);
});

test('converts Python requests snippets with params, headers, json, timeout, and redirects', () => {
  const result = convertCodeToCurl(
    `requests.post(
      "https://api.example.com/search",
      params={"q": "convert app", "page": 2},
      headers={"X-Api-Key": "abc123"},
      json={"enabled": True, "count": 3},
      timeout=15,
      allow_redirects=False,
    )`,
    {
      language: 'python-requests',
      multiline: false,
      includeTimeout: true,
      redactSensitiveValues: true,
    },
  );

  assert.equal(
    result.command,
    `curl -X POST 'https://api.example.com/search?q=convert%20app&page=2' -H 'X-Api-Key: <X_API_KEY_VALUE>' -H 'Content-Type: application/json' --data-raw '{"enabled":true,"count":3}' --max-time 15`,
  );
  assert.equal(result.warnings.some((warning) => warning.includes('allow_redirects=False')), true);
});

test('converts raw HTTP request snippets to curl', () => {
  const result = convertCodeToCurl(
    `PUT /tasks/1 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{"done":true}`,
    {
      language: 'http',
      multiline: false,
    },
  );

  assert.equal(
    result.command,
    `curl -X PUT 'https://api.example.com/tasks/1' -H 'Content-Type: application/json' --data-raw '{"done":true}'`,
  );
});

test('honors curl output options independently from parsed request settings', () => {
  const result = convertCodeToCurl(
    `requests.post("https://api.example.com/jobs", data="queued", timeout=15)`,
    {
      language: 'python-requests',
      multiline: false,
      includeTimeout: false,
      includeCompressed: false,
      followRedirects: false,
      redactSensitiveValues: false,
    },
  );

  assert.equal(
    result.command,
    `curl -X POST 'https://api.example.com/jobs' --data-raw 'queued'`,
  );
  assert.doesNotMatch(result.command, /--max-time/);
  assert.doesNotMatch(result.command, /--compressed/);
  assert.doesNotMatch(result.command, /--location/);
});

test('returns clear Korean errors for unsupported or incomplete snippets', () => {
  assert.throws(
    () => convertCodeToCurl('', { language: 'javascript-fetch' }),
    /변환할 코드 스니펫을 입력해주세요/,
  );

  assert.throws(
    () => convertCodeToCurl('axios.get("/users")', { language: 'javascript-fetch' }),
    /JavaScript fetch 호출을 찾을 수 없습니다/,
  );

  assert.throws(
    () => convertCodeToCurl('fetch("/relative")', { language: 'javascript-fetch' }),
    /절대 URL만 curl로 변환할 수 있습니다/,
  );

  assert.throws(
    () => convertCodeToCurl('fetch("https://api.example.com")', { language: 'ruby' }),
    /지원하지 않는 입력 언어입니다/,
  );

  assert.throws(
    () =>
      convertCodeToCurl(
        'fetch("https://api.example.com", { headers: new Headers([["Accept", "application/json"]]) })',
        { language: 'javascript-fetch' },
      ),
    /new Headers\(\.\.\.\) 형태는 아직 지원하지 않습니다/,
  );
});

test('exposes supported source languages for the UI', () => {
  assert.deepEqual(
    getCodeToCurlInputLanguages().map((language) => language.id),
    ['javascript-fetch', 'python-requests', 'http'],
  );
});
