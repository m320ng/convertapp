import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatRandomTokenResults,
  generateRandomTokens,
  getRandomTokenCharacterPool,
} from './random-token.ts';

function generate(options = {}) {
  return generateRandomTokens({
    length: 16,
    quantity: 1,
    characterSets: {
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: false,
    },
    excludeCharacters: '',
    excludeAmbiguous: false,
    ...options,
  });
}

test('generates the requested quantity of tokens at the requested length', () => {
  const tokens = generate({ length: 24, quantity: 5 });

  assert.equal(tokens.length, 5);
  assert.ok(tokens.every((token) => token.length === 24));
  assert.ok(tokens.every((token) => /^[a-zA-Z0-9]+$/.test(token)));
});

test('builds the character pool from selected character sets only', () => {
  const pool = getRandomTokenCharacterPool({
    lowercase: false,
    uppercase: false,
    numbers: true,
    symbols: false,
  });

  assert.equal(pool, '0123456789');
  assert.ok(generate({
    length: 32,
    quantity: 3,
    characterSets: {
      lowercase: false,
      uppercase: false,
      numbers: true,
      symbols: false,
    },
  }).every((token) => /^\d+$/.test(token)));
});

test('removes custom excluded characters from the generation pool', () => {
  const tokens = generate({
    length: 40,
    quantity: 4,
    characterSets: {
      lowercase: false,
      uppercase: false,
      numbers: true,
      symbols: false,
    },
    excludeCharacters: '02468',
  });

  assert.ok(tokens.every((token) => /^[13579]+$/.test(token)));
});

test('supports symbols-only generation after applying exclusions', () => {
  const pool = getRandomTokenCharacterPool(
    {
      lowercase: false,
      uppercase: false,
      numbers: false,
      symbols: true,
    },
    { excludeCharacters: '!@#$%^&*()-_=+[]{};:,.<>' },
  );

  assert.equal(pool, '?');
  assert.deepEqual(
    generate({
      length: 8,
      quantity: 2,
      characterSets: {
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: true,
      },
      excludeCharacters: '!@#$%^&*()-_=+[]{};:,.<>',
    }),
    ['????????', '????????'],
  );
});

test('rejects option combinations that leave no available generation characters', () => {
  assert.throws(
    () =>
      generate({
        characterSets: {
          lowercase: false,
          uppercase: false,
          numbers: true,
          symbols: false,
        },
        excludeCharacters: '0123456789',
      }),
    /제외 문자를 적용한 뒤 사용할 수 있는 문자가 없습니다/,
  );
});

test('can exclude visually ambiguous characters', () => {
  const pool = getRandomTokenCharacterPool(
    {
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: false,
    },
    { excludeAmbiguous: true },
  );

  assert.equal(pool.includes('0'), false);
  assert.equal(pool.includes('O'), false);
  assert.equal(pool.includes('l'), false);
  assert.equal(pool.includes('1'), false);
});

test('returns clear Korean validation errors for invalid options', () => {
  assert.throws(
    () => generateRandomTokens(null),
    /토큰 생성 옵션을 확인해주세요/,
  );

  assert.throws(
    () => generate({ length: 0 }),
    /토큰 길이는 1자 이상이어야 합니다/,
  );

  assert.throws(
    () => generate({ length: Number.NaN }),
    /토큰 길이는 숫자로 입력해주세요/,
  );

  assert.throws(
    () => generate({ length: 1.5 }),
    /토큰 길이는 정수로 입력해주세요/,
  );

  assert.throws(
    () => generate({ quantity: 0 }),
    /생성 개수는 1개 이상이어야 합니다/,
  );

  assert.throws(
    () => generate({ quantity: Number.POSITIVE_INFINITY }),
    /생성 개수는 숫자로 입력해주세요/,
  );

  assert.throws(
    () => generate({ quantity: 1.5 }),
    /생성 개수는 정수로 입력해주세요/,
  );

  assert.throws(
    () => generate({ characterSets: null }),
    /문자 집합 설정을 확인해주세요/,
  );

  assert.throws(
    () => generate({
      characterSets: {
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: false,
      },
    }),
    /하나 이상의 문자 집합을 선택해주세요/,
  );

  assert.throws(
    () => generate({ excludeCharacters: 'a'.repeat(257) }),
    /제외할 문자는 256자 이하로 입력해주세요/,
  );

  assert.throws(
    () => generate({ excludeCharacters: null }),
    /제외할 문자는 텍스트로 입력해주세요/,
  );
});

test('formats generated token results for common copy actions', () => {
  const tokens = ['alpha123', 'beta456'];

  assert.equal(formatRandomTokenResults(tokens, 'newline'), 'alpha123\nbeta456');
  assert.equal(formatRandomTokenResults(tokens, 'csv'), 'alpha123,beta456');
  assert.equal(
    formatRandomTokenResults(tokens, 'json'),
    '[\n  "alpha123",\n  "beta456"\n]',
  );
  assert.equal(
    formatRandomTokenResults(tokens, 'env'),
    'TOKEN_1=alpha123\nTOKEN_2=beta456',
  );
});

test('escapes generated token copy payloads when delimiters appear in token values', () => {
  const tokens = ['alpha,123', 'beta"456', 'gamma\n789'];

  assert.equal(
    formatRandomTokenResults(tokens, 'csv'),
    '"alpha,123","beta""456","gamma\n789"',
  );
});
