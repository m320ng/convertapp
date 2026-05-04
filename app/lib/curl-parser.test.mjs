import test from 'node:test';
import assert from 'node:assert/strict';

import { CurlParseError, parseCurlCommand } from './curl-parser.ts';

test('parses a curl command into structured request details', () => {
  const parsed = parseCurlCommand(String.raw`curl -X PUT "https://api.example.com/users/42?active=true" \
    -H "Authorization: Bearer secret-token" \
    -H "Content-Type: application/json" \
    --data-raw '{"name":"홍길동"}' \
    --compressed --location`);

  assert.equal(parsed.method, 'PUT');
  assert.equal(parsed.url, 'https://api.example.com/users/42?active=true');
  assert.deepEqual(parsed.headers, [
    { name: 'Authorization', value: 'Bearer secret-token' },
    { name: 'Content-Type', value: 'application/json' },
  ]);
  assert.equal(parsed.body, '{"name":"홍길동"}');
  assert.deepEqual(parsed.options, {
    compressed: true,
    followRedirects: true,
    insecure: false,
    headOnly: false,
  });
});

test('infers POST when data is provided without an explicit method', () => {
  const parsed = parseCurlCommand('curl https://api.example.com/items -d name=test -d enabled=true');

  assert.equal(parsed.method, 'POST');
  assert.equal(parsed.body, 'name=test&enabled=true');
});

test('parses compact short flags without swallowing the URL', () => {
  const parsed = parseCurlCommand('curl -XPATCH -HAccept:application/json -dstatus=done https://api.example.com/tasks/1');

  assert.equal(parsed.method, 'PATCH');
  assert.equal(parsed.url, 'https://api.example.com/tasks/1');
  assert.deepEqual(parsed.headers, [
    { name: 'Accept', value: 'application/json' },
  ]);
  assert.equal(parsed.body, 'status=done');
});

test('reports malformed commands with structured Korean errors', () => {
  assert.throws(
    () => parseCurlCommand('curl "https://api.example.com'),
    (error) => {
      assert.ok(error instanceof CurlParseError);
      assert.equal(error.code, 'UNTERMINATED_QUOTE');
      assert.match(error.message, /따옴표가 닫히지 않았습니다/);
      return true;
    },
  );

  assert.throws(
    () => parseCurlCommand('curl -H "Accept application/json" https://api.example.com'),
    (error) => {
      assert.ok(error instanceof CurlParseError);
      assert.equal(error.code, 'INVALID_HEADER');
      assert.match(error.message, /헤더는 "이름: 값" 형식이어야 합니다/);
      return true;
    },
  );
});

test('reports unsupported flags and missing values with structured Korean errors', () => {
  assert.throws(
    () => parseCurlCommand('curl --cert client.pem https://api.example.com'),
    (error) => {
      assert.ok(error instanceof CurlParseError);
      assert.equal(error.code, 'UNSUPPORTED_FLAG');
      assert.equal(error.flag, '--cert');
      assert.match(error.message, /지원하지 않는 curl 옵션입니다/);
      return true;
    },
  );

  assert.throws(
    () => parseCurlCommand('curl -H https://api.example.com'),
    (error) => {
      assert.ok(error instanceof CurlParseError);
      assert.equal(error.code, 'MISSING_FLAG_VALUE');
      assert.equal(error.flag, '-H');
      assert.match(error.message, /값이 필요합니다/);
      return true;
    },
  );
});
