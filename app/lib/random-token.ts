export interface RandomTokenCharacterSets {
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export interface RandomTokenOptions {
  length: number;
  quantity: number;
  characterSets: RandomTokenCharacterSets;
  excludeCharacters: string;
  excludeAmbiguous: boolean;
}

export type RandomTokenCopyFormat = 'newline' | 'json' | 'env' | 'csv';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?';
const AMBIGUOUS_CHARACTERS = '0O1Il|`\'"';

const MAX_LENGTH = 4096;
const MAX_QUANTITY = 100;
const MAX_EXCLUDED_CHARACTERS = 256;
const CHARACTER_SET_KEYS = ['lowercase', 'uppercase', 'numbers', 'symbols'] as const;

export function getRandomTokenCharacterPool(
  characterSets: RandomTokenCharacterSets,
  options: Partial<Pick<RandomTokenOptions, 'excludeCharacters' | 'excludeAmbiguous'>> = {},
) {
  let pool = '';

  if (characterSets.lowercase) pool += LOWERCASE;
  if (characterSets.uppercase) pool += UPPERCASE;
  if (characterSets.numbers) pool += NUMBERS;
  if (characterSets.symbols) pool += SYMBOLS;

  const exclusions = new Set([
    ...(options.excludeCharacters ?? ''),
    ...(options.excludeAmbiguous ? AMBIGUOUS_CHARACTERS : ''),
  ]);

  return [...pool].filter((character) => !exclusions.has(character)).join('');
}

export function validateRandomTokenOptions(options: RandomTokenOptions) {
  if (typeof options !== 'object' || options === null) {
    throw new Error('토큰 생성 옵션을 확인해주세요.');
  }

  if (!Number.isFinite(options.length)) {
    throw new Error('토큰 길이는 숫자로 입력해주세요.');
  }

  if (!Number.isInteger(options.length)) {
    throw new Error('토큰 길이는 정수로 입력해주세요.');
  }

  if (options.length < 1) {
    throw new Error('토큰 길이는 1자 이상이어야 합니다.');
  }

  if (options.length > MAX_LENGTH) {
    throw new Error(`토큰 길이는 ${MAX_LENGTH}자 이하로 입력해주세요.`);
  }

  if (!Number.isFinite(options.quantity)) {
    throw new Error('생성 개수는 숫자로 입력해주세요.');
  }

  if (!Number.isInteger(options.quantity)) {
    throw new Error('생성 개수는 정수로 입력해주세요.');
  }

  if (options.quantity < 1) {
    throw new Error('생성 개수는 1개 이상이어야 합니다.');
  }

  if (options.quantity > MAX_QUANTITY) {
    throw new Error(`생성 개수는 ${MAX_QUANTITY}개 이하로 입력해주세요.`);
  }

  if (!isValidCharacterSetOptions(options.characterSets)) {
    throw new Error('문자 집합 설정을 확인해주세요.');
  }

  if (typeof options.excludeCharacters !== 'string') {
    throw new Error('제외할 문자는 텍스트로 입력해주세요.');
  }

  if (options.excludeCharacters.length > MAX_EXCLUDED_CHARACTERS) {
    throw new Error(`제외할 문자는 ${MAX_EXCLUDED_CHARACTERS}자 이하로 입력해주세요.`);
  }

  if (!Object.values(options.characterSets).some(Boolean)) {
    throw new Error('하나 이상의 문자 집합을 선택해주세요.');
  }

  const pool = getRandomTokenCharacterPool(options.characterSets, options);

  if (pool.length === 0) {
    throw new Error('제외 문자를 적용한 뒤 사용할 수 있는 문자가 없습니다.');
  }

  return pool;
}

function isValidCharacterSetOptions(
  characterSets: RandomTokenOptions['characterSets'],
): characterSets is RandomTokenCharacterSets {
  return (
    typeof characterSets === 'object' &&
    characterSets !== null &&
    CHARACTER_SET_KEYS.every((key) => typeof characterSets[key] === 'boolean')
  );
}

export function generateRandomTokens(options: RandomTokenOptions) {
  const pool = validateRandomTokenOptions(options);

  return Array.from({ length: options.quantity }, () =>
    generateToken(options.length, pool),
  );
}

export function formatRandomTokenResults(
  tokens: string[],
  format: RandomTokenCopyFormat,
) {
  if (format === 'json') {
    return JSON.stringify(tokens, null, 2);
  }

  if (format === 'env') {
    return tokens
      .map((token, index) => `TOKEN_${index + 1}=${token}`)
      .join('\n');
  }

  if (format === 'csv') {
    return tokens.map(formatCsvField).join(',');
  }

  return tokens.join('\n');
}

function formatCsvField(value: string) {
  if (!/[",\r\n]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function generateToken(length: number, pool: string) {
  let token = '';
  const maxAcceptedValue = Math.floor(0xffffffff / pool.length) * pool.length;

  while (token.length < length) {
    const randomValue = getSecureRandomUint32();

    if (randomValue < maxAcceptedValue) {
      token += pool[randomValue % pool.length];
    }
  }

  return token;
}

function getSecureRandomUint32() {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.getRandomValues) {
    throw new Error('이 브라우저는 안전한 난수 생성을 지원하지 않습니다.');
  }

  const buffer = new Uint32Array(1);
  cryptoApi.getRandomValues(buffer);
  return buffer[0];
}
