import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatEnvValidationResult,
  getEnvIssueFeedback,
  parseEnvContent,
  safeParseEnvContent,
} from './env-validator.ts';

const validEnvStringFixtures = [
  {
    name: 'keeps URL fragments when hashes are part of an unquoted value',
    content: 'API_URL=https://example.com/callback#token',
    entries: [
      { key: 'API_URL', value: 'https://example.com/callback#token', quote: 'none' },
    ],
  },
  {
    name: 'removes inline comments only when separated from unquoted values',
    content: 'CACHE_HOST=localhost # local cache',
    entries: [
      { key: 'CACHE_HOST', value: 'localhost', quote: 'none' },
    ],
  },
  {
    name: 'preserves spaces and hash characters inside single quoted values',
    content: "WELCOME_TEXT='hello # production user'",
    entries: [
      { key: 'WELCOME_TEXT', value: 'hello # production user', quote: 'single' },
    ],
  },
  {
    name: 'decodes supported double quoted escape sequences',
    content: 'ESCAPED="line\\nnext\\tindent\\$HOME"',
    entries: [
      { key: 'ESCAPED', value: 'line\nnext\tindent$HOME', quote: 'double' },
    ],
  },
  {
    name: 'accepts CRLF line endings with export prefixes and empty values',
    content: 'export FEATURE_FLAG=true\r\nEMPTY_VALUE=',
    entries: [
      { key: 'FEATURE_FLAG', value: 'true', quote: 'none' },
      { key: 'EMPTY_VALUE', value: '', quote: 'none' },
    ],
  },
];

const invalidEnvStringFixtures = [
  {
    name: 'missing equals sign',
    content: 'API_URL https://example.com',
    code: 'MISSING_EQUALS',
    message: /KEY=VALUE 형식/,
  },
  {
    name: 'empty key before equals sign',
    content: '=secret',
    code: 'EMPTY_KEY',
    message: /변수 이름을 입력해주세요/,
  },
  {
    name: 'key starts with a number',
    content: '1PASSWORD=secret',
    code: 'INVALID_KEY',
    message: /변수 이름은 영문자 또는 밑줄로 시작/,
    key: '1PASSWORD',
  },
  {
    name: 'duplicate key',
    content: 'SECRET=one\nSECRET=two',
    code: 'DUPLICATE_KEY',
    message: /중복된 변수 이름/,
    key: 'SECRET',
  },
  {
    name: 'unquoted string containing a space',
    content: 'GREETING=hello world',
    code: 'UNQUOTED_SPACE',
    message: /공백이 포함된 문자열은 따옴표로 감싸주세요/,
    key: 'GREETING',
  },
  {
    name: 'unclosed quoted string',
    content: 'SECRET="missing end',
    code: 'UNCLOSED_QUOTE',
    message: /따옴표가 닫히지 않았습니다/,
    key: 'SECRET',
  },
  {
    name: 'unsupported double quoted escape sequence',
    content: 'SECRET="bad\\q"',
    code: 'INVALID_ESCAPE',
    message: /지원하지 않는 이스케이프 문자입니다/,
    key: 'SECRET',
  },
  {
    name: 'characters after a closing quote',
    content: 'SECRET="ok"text',
    code: 'TRAILING_CHARACTERS',
    message: /닫는 따옴표 뒤에는 주석만 올 수 있습니다/,
    key: 'SECRET',
  },
];

test('valid .env string fixtures parse into expected local-only entries', async (t) => {
  for (const fixture of validEnvStringFixtures) {
    await t.test(fixture.name, () => {
      const result = parseEnvContent(fixture.content);

      assert.equal(result.valid, true);
      assert.deepEqual(result.issues, []);
      assert.deepEqual(
        result.entries.map((entry) => ({
          key: entry.key,
          value: entry.value,
          quote: entry.quote,
        })),
        fixture.entries,
      );
    });
  }
});

test('invalid .env string fixtures return focused Korean validation issues', async (t) => {
  for (const fixture of invalidEnvStringFixtures) {
    await t.test(fixture.name, () => {
      const result = parseEnvContent(fixture.content);

      assert.equal(result.valid, false);
      assert.equal(result.issues.length, 1);
      assert.equal(result.issues[0].code, fixture.code);
      assert.match(result.issues[0].message, fixture.message);
      assert.equal(result.issues[0].key, fixture.key);
    });
  }
});

test('parses .env entries with comments, export prefixes, quoted strings, and escapes', () => {
  const result = parseEnvContent(`
# application settings
APP_NAME="ConvertApp"
export API_URL=https://example.com/api#v1
SINGLE_QUOTED='literal # value'
MULTILINE="first\\nsecond"
EMPTY=
`);

  assert.equal(result.valid, true);
  assert.deepEqual(
    result.entries.map((entry) => ({
      key: entry.key,
      value: entry.value,
      quote: entry.quote,
      line: entry.line,
    })),
    [
      { key: 'APP_NAME', value: 'ConvertApp', quote: 'double', line: 3 },
      { key: 'API_URL', value: 'https://example.com/api#v1', quote: 'none', line: 4 },
      { key: 'SINGLE_QUOTED', value: 'literal # value', quote: 'single', line: 5 },
      { key: 'MULTILINE', value: 'first\nsecond', quote: 'double', line: 6 },
      { key: 'EMPTY', value: '', quote: 'none', line: 7 },
    ],
  );
  assert.deepEqual(result.issues, []);
});

test('reports Korean validation errors for string-related .env issues', () => {
  const result = parseEnvContent(`
INVALID-KEY=value
DUPLICATE=one
DUPLICATE=two
UNQUOTED=hello world
UNCLOSED="missing end
BAD_ESCAPE="bad\\q"
TRAILING="ok"text
`);

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    [
      'INVALID_KEY',
      'DUPLICATE_KEY',
      'UNQUOTED_SPACE',
      'UNCLOSED_QUOTE',
      'INVALID_ESCAPE',
      'TRAILING_CHARACTERS',
    ],
  );
  assert.match(result.issues[0].message, /변수 이름은 영문자 또는 밑줄로 시작/);
  assert.match(result.issues[1].message, /중복된 변수 이름입니다/);
  assert.match(result.issues[2].message, /공백이 포함된 문자열은 따옴표로 감싸주세요/);
  assert.match(result.issues[3].message, /따옴표가 닫히지 않았습니다/);
  assert.match(result.issues[4].message, /지원하지 않는 이스케이프 문자입니다/);
  assert.match(result.issues[5].message, /닫는 따옴표 뒤에는 주석만 올 수 있습니다/);
});

test('returns a non-throwing Korean error result for non-string input and empty content', () => {
  const invalidInput = safeParseEnvContent(null);
  assert.equal(invalidInput.ok, false);
  assert.equal(invalidInput.error, '.env 내용은 텍스트로 입력해주세요.');

  const emptyInput = safeParseEnvContent('   \n# comment only');
  assert.equal(emptyInput.ok, true);
  assert.equal(emptyInput.result.valid, false);
  assert.equal(emptyInput.result.issues[0].message, '검사할 .env 변수를 입력해주세요.');
});

test('formats validation results for copy actions without storing sensitive values by default', () => {
  const result = parseEnvContent('SECRET_KEY="super-secret"\nPUBLIC_URL=https://example.com');

  assert.equal(
    formatEnvValidationResult(result),
    [
      '.env 검사 결과',
      '상태: 통과',
      '변수: 2개',
      '',
      '변수 목록:',
      '- SECRET_KEY: 문자열 12자 (값 숨김)',
      '- PUBLIC_URL: 문자열 19자 (값 숨김)',
    ].join('\n'),
  );
});

test('returns clear Korean UI feedback for detected .env string issues', () => {
  const result = parseEnvContent('GREETING=hello world\nBAD_ESCAPE="bad\\q"\nTRAILING="ok"text');

  assert.deepEqual(
    result.issues.map((issue) => getEnvIssueFeedback(issue)),
    [
      {
        title: '따옴표가 필요한 문자열',
        message: '공백이 포함된 문자열은 따옴표로 감싸주세요.',
        location: '1행 15열',
        suggestion: '예: GREETING="hello world"처럼 값을 큰따옴표 또는 작은따옴표로 감싸주세요.',
      },
      {
        title: '지원하지 않는 이스케이프 문자',
        message: '지원하지 않는 이스케이프 문자입니다. \\n, \\r, \\t, \\", \\\\, \\$만 사용할 수 있습니다.',
        location: '2행 16열',
        suggestion: '허용된 이스케이프만 사용하거나 역슬래시를 제거해주세요.',
      },
      {
        title: '닫는 따옴표 뒤의 잘못된 문자',
        message: '닫는 따옴표 뒤에는 주석만 올 수 있습니다.',
        location: '3행 14열',
        suggestion: '닫는 따옴표 뒤의 문자를 제거하거나 # 주석으로 분리해주세요.',
      },
    ],
  );
});
