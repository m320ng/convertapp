import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, createVerify, generateKeyPairSync } from 'node:crypto';

import { buildJwtPayloadFromClaims, generateJwt, supportedJwtAlgorithms } from './jwt-generator.ts';
import { decodeJwt } from './jwt-decoder.ts';

test('generates an HS256 token from editable header and payload JSON', async () => {
  const token = await generateJwt({
    algorithm: 'HS256',
    headerJson: '{ "typ": "JWT", "kid": "local-key" }',
    payloadJson: '{ "sub": "123", "name": "외동길", "admin": true }',
    key: 'secret',
  });
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  const expectedSignature = createHmac('sha256', 'secret')
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  assert.equal(signature, expectedSignature);

  const decoded = decodeJwt(token);
  assert.deepEqual(decoded.header, {
    typ: 'JWT',
    kid: 'local-key',
    alg: 'HS256',
  });
  assert.deepEqual(decoded.payload, {
    sub: '123',
    name: '외동길',
    admin: true,
  });
});

test('generates an RS256 token that verifies with the matching public key', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const rsaPrivateKey = privateKey.export({
    format: 'pem',
    type: 'pkcs8',
  });
  const token = await generateJwt({
    algorithm: 'RS256',
    headerJson: '{ "typ": "JWT" }',
    payloadJson: '{ "iss": "convertapp", "iat": 1710000000 }',
    key: rsaPrivateKey,
  });

  const [encodedHeader, encodedPayload, signature] = token.split('.');
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  assert.equal(
    verifier.verify(publicKey, Buffer.from(signature, 'base64url')),
    true,
  );
});

test('reports generator validation errors clearly in Korean', async () => {
  await assert.rejects(
    () =>
      generateJwt({
        algorithm: 'HS256',
        headerJson: '{ invalid',
        payloadJson: '{}',
        key: 'secret',
      }),
    /JWT header JSON을 파싱할 수 없습니다/,
  );

  await assert.rejects(
    () =>
      generateJwt({
        algorithm: 'HS256',
        headerJson: '{}',
        payloadJson: '{}',
        key: '   ',
      }),
    /서명에 사용할 secret 또는 private key를 입력해주세요/,
  );
});

test('builds a JWT payload from standard and custom claims', () => {
  const payload = buildJwtPayloadFromClaims({
    basePayloadJson: '{ "role": "editor" }',
    standardClaims: {
      issuer: 'https://issuer.example',
      subject: 'user-123',
      audience: 'convertapp-api',
      issuedAt: '1710000000',
      expiration: '1710003600',
      notBefore: '1709999900',
    },
    customClaimsJson: '{ "scope": ["read", "write"], "plan": "pro" }',
  });

  assert.deepEqual(payload, {
    role: 'editor',
    iss: 'https://issuer.example',
    sub: 'user-123',
    aud: 'convertapp-api',
    iat: 1710000000,
    exp: 1710003600,
    nbf: 1709999900,
    scope: ['read', 'write'],
    plan: 'pro',
  });
});

test('lets standard claim fields override duplicate custom and base payload values', () => {
  const payload = buildJwtPayloadFromClaims({
    basePayloadJson: '{ "iss": "old-issuer", "sub": "old-subject" }',
    standardClaims: {
      issuer: 'new-issuer',
      subject: 'new-subject',
    },
    customClaimsJson: '{ "iss": "custom-issuer", "tier": "team" }',
  });

  assert.deepEqual(payload, {
    iss: 'new-issuer',
    sub: 'new-subject',
    tier: 'team',
  });
});

test('reports advanced claim validation errors clearly in Korean', () => {
  assert.throws(
    () =>
      buildJwtPayloadFromClaims({
        basePayloadJson: '{}',
        standardClaims: {
          expiration: 'tomorrow',
        },
        customClaimsJson: '{}',
      }),
    /expiration 값은 Unix timestamp 숫자로 입력해주세요/,
  );

  assert.throws(
    () =>
      buildJwtPayloadFromClaims({
        basePayloadJson: '{}',
        standardClaims: {},
        customClaimsJson: '[]',
      }),
    /custom claims JSON을 파싱할 수 없습니다/,
  );
});

test('exposes supported signing algorithms for the UI', () => {
  assert.deepEqual(supportedJwtAlgorithms, ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512']);
});
