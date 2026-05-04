import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { decodeJwt, validateJwt } from './jwt-decoder.ts';

const validJwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuyZuOuPmeq4uCIsImlhdCI6MTUxNjIzOTAyMn0.' +
  'TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';

test('decodes JWT header, payload, and signature', () => {
  const decoded = decodeJwt(validJwt);

  assert.deepEqual(decoded.header, {
    alg: 'HS256',
    typ: 'JWT',
  });
  assert.deepEqual(decoded.payload, {
    sub: '1234567890',
    name: '외동길',
    iat: 1516239022,
  });
  assert.equal(decoded.signature, 'TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ');
  assert.equal(decoded.headerJson, '{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  assert.match(decoded.payloadJson, /"name": "외동길"/);
});

test('reports malformed token errors clearly in Korean', () => {
  assert.throws(
    () => decodeJwt('header.payload'),
    /JWT는 header\.payload\.signature 형식의 3개 구역으로 구성되어야 합니다/,
  );

  assert.throws(
    () => decodeJwt('header..signature'),
    /JWT payload 구역이 비어 있습니다/,
  );
});

test('reports base64url decoding errors clearly in Korean', () => {
  assert.throws(
    () => decodeJwt('not valid.eyJzdWIiOiIxMjMifQ.signature'),
    /JWT header 구역을 Base64URL로 디코딩할 수 없습니다/,
  );
});

test('reports JSON parsing errors clearly in Korean', () => {
  const invalidJsonPayload = 'bm90IGpzb24';

  assert.throws(
    () => decodeJwt(`eyJhbGciOiJIUzI1NiJ9.${invalidJsonPayload}.signature`),
    /JWT payload 구역의 JSON을 파싱할 수 없습니다/,
  );
});

test('validates an HS256 JWT signature with the provided secret', async () => {
  const token = signTestJwt(
    { alg: 'HS256', typ: 'JWT' },
    { sub: '123', exp: 1_710_003_600, nbf: 1_710_000_000 },
    'correct-secret',
  );

  const result = await validateJwt(token, {
    secret: 'correct-secret',
    now: new Date('2024-03-09T16:30:00Z'),
  });

  assert.equal(result.signatureValid, true);
  assert.equal(result.claimsValid, true);
});

test('reports JWT validation errors clearly in Korean', async () => {
  await assert.rejects(
    () => validateJwt('', { secret: 'secret' }),
    /JWT 토큰을 입력해주세요/,
  );

  await assert.rejects(
    () => validateJwt(validJwt, { secret: '   ' }),
    /서명 검증에 사용할 secret을 입력해주세요/,
  );

  const unsupportedAlgorithmToken = signTestJwt({ alg: 'none' }, { sub: '123' }, 'secret');
  await assert.rejects(
    () => validateJwt(unsupportedAlgorithmToken, { secret: 'secret' }),
    /지원하지 않는 JWT 알고리즘입니다/,
  );

  const mismatchedToken = signTestJwt({ alg: 'HS256' }, { sub: '123' }, 'correct-secret');
  await assert.rejects(
    () => validateJwt(mismatchedToken, { secret: 'wrong-secret' }),
    /JWT 서명이 일치하지 않습니다/,
  );

  const expiredToken = signTestJwt({ alg: 'HS256' }, { exp: 1_710_000_000 }, 'secret');
  await assert.rejects(
    () =>
      validateJwt(expiredToken, {
        secret: 'secret',
        now: new Date('2024-03-09T16:00:01Z'),
      }),
    /JWT가 만료되었습니다/,
  );

  const notYetValidToken = signTestJwt({ alg: 'HS256' }, { nbf: 1_710_003_600 }, 'secret');
  await assert.rejects(
    () =>
      validateJwt(notYetValidToken, {
        secret: 'secret',
        now: new Date('2024-03-09T15:59:59Z'),
      }),
    /JWT가 아직 유효하지 않습니다/,
  );
});

function signTestJwt(header, payload, secret) {
  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
}

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}
