export const supportedJwtAlgorithms = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'] as const;

export type SupportedJwtAlgorithm = (typeof supportedJwtAlgorithms)[number];

interface GenerateJwtOptions {
  algorithm: SupportedJwtAlgorithm;
  headerJson: string;
  payloadJson: string;
  key: string;
}

export interface JwtStandardClaimsInput {
  issuer?: string;
  subject?: string;
  audience?: string;
  issuedAt?: string;
  expiration?: string;
  notBefore?: string;
}

interface BuildJwtPayloadOptions {
  basePayloadJson: string;
  standardClaims: JwtStandardClaimsInput;
  customClaimsJson?: string;
}

const HMAC_ALGORITHMS: Record<Extract<SupportedJwtAlgorithm, `HS${string}`>, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

const RSA_ALGORITHMS: Record<Extract<SupportedJwtAlgorithm, `RS${string}`>, string> = {
  RS256: 'SHA-256',
  RS384: 'SHA-384',
  RS512: 'SHA-512',
};

export async function generateJwt({
  algorithm,
  headerJson,
  payloadJson,
  key,
}: GenerateJwtOptions): Promise<string> {
  if (!supportedJwtAlgorithms.includes(algorithm)) {
    throw new Error('지원하지 않는 JWT 서명 알고리즘입니다.');
  }

  const trimmedKey = key.trim();

  if (!trimmedKey) {
    throw new Error('서명에 사용할 secret 또는 private key를 입력해주세요.');
  }

  const header = parseJsonObject(headerJson, 'header');
  const payload = parseJsonObject(payloadJson, 'payload');
  const normalizedHeader = {
    ...header,
    alg: algorithm,
  };
  const encodedHeader = encodeBase64Url(JSON.stringify(normalizedHeader));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signJwtInput(signingInput, algorithm, trimmedKey);

  return `${signingInput}.${signature}`;
}

export function buildJwtPayloadFromClaims({
  basePayloadJson,
  standardClaims,
  customClaimsJson = '{}',
}: BuildJwtPayloadOptions): Record<string, unknown> {
  const basePayload = parseJsonObject(basePayloadJson, 'payload');
  const customClaims = customClaimsJson.trim()
    ? parseJsonObject(customClaimsJson, 'custom claims')
    : {};
  const normalizedStandardClaims = normalizeStandardClaims(standardClaims);

  return {
    ...basePayload,
    ...customClaims,
    ...normalizedStandardClaims,
  };
}

function parseJsonObject(
  json: string,
  section: 'header' | 'payload' | 'custom claims',
): Record<string, unknown> {
  if (!json.trim()) {
    throw new Error(`JWT ${section} JSON을 입력해주세요.`);
  }

  try {
    const parsed = JSON.parse(json);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('not-object');
    }

    return parsed;
  } catch {
    throw new Error(`JWT ${section} JSON을 파싱할 수 없습니다. 객체 형태의 올바른 JSON을 입력해주세요.`);
  }
}

function normalizeStandardClaims(claims: JwtStandardClaimsInput): Record<string, unknown> {
  const normalizedClaims: Record<string, unknown> = {};
  const stringClaimMap = [
    ['issuer', 'iss'],
    ['subject', 'sub'],
    ['audience', 'aud'],
  ] as const;
  const numericClaimMap = [
    ['issuedAt', 'iat', 'issued-at'],
    ['expiration', 'exp', 'expiration'],
    ['notBefore', 'nbf', 'not-before'],
  ] as const;

  for (const [inputKey, jwtKey] of stringClaimMap) {
    const value = claims[inputKey]?.trim();

    if (value) {
      normalizedClaims[jwtKey] = value;
    }
  }

  for (const [inputKey, jwtKey, label] of numericClaimMap) {
    const value = claims[inputKey]?.trim();

    if (value) {
      normalizedClaims[jwtKey] = parseUnixTimestamp(value, label);
    }
  }

  return normalizedClaims;
}

function parseUnixTimestamp(value: string, label: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} 값은 Unix timestamp 숫자로 입력해주세요.`);
  }

  const timestamp = Number(value);

  if (!Number.isSafeInteger(timestamp)) {
    throw new Error(`${label} 값은 안전한 Unix timestamp 범위 안에서 입력해주세요.`);
  }

  return timestamp;
}

async function signJwtInput(
  signingInput: string,
  algorithm: SupportedJwtAlgorithm,
  key: string,
): Promise<string> {
  const cryptoApi = globalThis.crypto?.subtle;

  if (!cryptoApi) {
    throw new Error('이 브라우저에서는 JWT 서명을 지원하지 않습니다.');
  }

  const inputBytes = toArrayBuffer(new TextEncoder().encode(signingInput));
  const signature =
    algorithm in HMAC_ALGORITHMS
      ? await signHmac(inputBytes, algorithm as keyof typeof HMAC_ALGORITHMS, key)
      : await signRsa(inputBytes, algorithm as keyof typeof RSA_ALGORITHMS, key);

  return encodeBytesBase64Url(new Uint8Array(signature));
}

async function signHmac(
  inputBytes: ArrayBuffer,
  algorithm: keyof typeof HMAC_ALGORITHMS,
  secret: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    toArrayBuffer(new TextEncoder().encode(secret)),
    {
      name: 'HMAC',
      hash: HMAC_ALGORITHMS[algorithm],
    },
    false,
    ['sign'],
  );

  return globalThis.crypto.subtle.sign('HMAC', cryptoKey, inputBytes);
}

async function signRsa(
  inputBytes: ArrayBuffer,
  algorithm: keyof typeof RSA_ALGORITHMS,
  privateKeyPem: string,
): Promise<ArrayBuffer> {
  try {
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'pkcs8',
      decodePemPrivateKey(privateKeyPem),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: RSA_ALGORITHMS[algorithm],
      },
      false,
      ['sign'],
    );

    return globalThis.crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, inputBytes);
  } catch {
    throw new Error('RSA 서명에 사용할 PKCS#8 private key를 확인해주세요.');
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function decodePemPrivateKey(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  if (!base64) {
    throw new Error('empty-key');
  }

  return decodeBase64(base64);
}

function encodeBase64Url(value: string): string {
  return encodeBytesBase64Url(new TextEncoder().encode(value));
}

function encodeBytesBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64(value: string): ArrayBuffer {
  const binary = atob(value);
  const output = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(output);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return output;
}
