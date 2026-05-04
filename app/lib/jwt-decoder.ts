export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  headerJson: string;
  payloadJson: string;
}

export interface ValidatedJwt extends DecodedJwt {
  signatureValid: true;
  claimsValid: true;
}

interface ValidateJwtOptions {
  secret: string;
  now?: Date;
}

type JwtSection = 'header' | 'payload';
type SupportedValidationAlgorithm = keyof typeof HMAC_VALIDATION_ALGORITHMS;

const SECTION_LABELS: Record<JwtSection, string> = {
  header: 'header',
  payload: 'payload',
};

const HMAC_VALIDATION_ALGORITHMS = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
} as const;

export function decodeJwt(token: string): DecodedJwt {
  const trimmedToken = token.trim();

  if (!trimmedToken) {
    throw new Error('JWT 토큰을 입력해주세요.');
  }

  const sections = trimmedToken.split('.');

  if (sections.length !== 3) {
    throw new Error('JWT는 header.payload.signature 형식의 3개 구역으로 구성되어야 합니다.');
  }

  const [encodedHeader, encodedPayload, signature] = sections;

  if (!encodedHeader) {
    throw new Error('JWT header 구역이 비어 있습니다.');
  }

  if (!encodedPayload) {
    throw new Error('JWT payload 구역이 비어 있습니다.');
  }

  const header = decodeJsonSection(encodedHeader, 'header');
  const payload = decodeJsonSection(encodedPayload, 'payload');

  return {
    header,
    payload,
    signature,
    headerJson: JSON.stringify(header, null, 2),
    payloadJson: JSON.stringify(payload, null, 2),
  };
}

export async function validateJwt(
  token: string,
  { secret, now = new Date() }: ValidateJwtOptions,
): Promise<ValidatedJwt> {
  const decodedJwt = decodeJwt(token);
  const trimmedSecret = secret.trim();

  if (!trimmedSecret) {
    throw new Error('서명 검증에 사용할 secret을 입력해주세요.');
  }

  if (!decodedJwt.signature) {
    throw new Error('JWT signature 구역이 비어 있어 서명을 검증할 수 없습니다.');
  }

  const algorithm = decodedJwt.header.alg;

  if (!isSupportedValidationAlgorithm(algorithm)) {
    throw new Error('지원하지 않는 JWT 알고리즘입니다. HS256, HS384, HS512만 검증할 수 있습니다.');
  }

  assertTimeClaims(decodedJwt.payload, now);

  const signingInput = token.trim().split('.').slice(0, 2).join('.');
  const expectedSignature = await signHmacJwtInput(signingInput, algorithm, trimmedSecret);

  if (!areBase64UrlValuesEqual(expectedSignature, decodedJwt.signature)) {
    throw new Error('JWT 서명이 일치하지 않습니다. secret과 토큰 서명을 확인해주세요.');
  }

  return {
    ...decodedJwt,
    signatureValid: true,
    claimsValid: true,
  };
}

function decodeJsonSection(encodedValue: string, section: JwtSection) {
  const decodedText = decodeBase64Url(encodedValue, section);

  try {
    const parsed = JSON.parse(decodedText);

    if (!isJsonObject(parsed)) {
      throw new Error('not-object');
    }

    return parsed;
  } catch {
    throw new Error(`JWT ${SECTION_LABELS[section]} 구역의 JSON을 파싱할 수 없습니다.`);
  }
}

function decodeBase64Url(encodedValue: string, section: JwtSection) {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(encodedValue)) {
    throw new Error(`JWT ${SECTION_LABELS[section]} 구역을 Base64URL로 디코딩할 수 없습니다.`);
  }

  const base64 = encodedValue.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  try {
    const binary =
      typeof atob === 'function'
        ? atob(paddedBase64)
        : Buffer.from(paddedBase64, 'base64').toString('binary');
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`JWT ${SECTION_LABELS[section]} 구역을 Base64URL로 디코딩할 수 없습니다.`);
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSupportedValidationAlgorithm(
  value: unknown,
): value is SupportedValidationAlgorithm {
  return typeof value === 'string' && value in HMAC_VALIDATION_ALGORITHMS;
}

function assertTimeClaims(payload: Record<string, unknown>, now: Date) {
  const currentTimestamp = Math.floor(now.getTime() / 1000);
  const expiration = parseJwtTimestampClaim(payload.exp, 'exp');
  const notBefore = parseJwtTimestampClaim(payload.nbf, 'nbf');

  if (expiration !== null && currentTimestamp >= expiration) {
    throw new Error('JWT가 만료되었습니다. exp 클레임 시간을 확인해주세요.');
  }

  if (notBefore !== null && currentTimestamp < notBefore) {
    throw new Error('JWT가 아직 유효하지 않습니다. nbf 클레임 시간을 확인해주세요.');
  }
}

function parseJwtTimestampClaim(value: unknown, claim: 'exp' | 'nbf'): number | null {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new Error(`JWT ${claim} 클레임은 Unix timestamp 숫자여야 합니다.`);
  }

  return value;
}

async function signHmacJwtInput(
  signingInput: string,
  algorithm: SupportedValidationAlgorithm,
  secret: string,
): Promise<string> {
  const cryptoApi = globalThis.crypto?.subtle;

  if (!cryptoApi) {
    throw new Error('이 브라우저에서는 JWT 서명 검증을 지원하지 않습니다.');
  }

  const cryptoKey = await cryptoApi.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {
      name: 'HMAC',
      hash: HMAC_VALIDATION_ALGORITHMS[algorithm],
    },
    false,
    ['sign'],
  );
  const signature = await cryptoApi.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  return encodeBytesBase64Url(new Uint8Array(signature));
}

function encodeBytesBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function areBase64UrlValuesEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}
