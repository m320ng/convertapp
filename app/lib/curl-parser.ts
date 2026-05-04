export type CurlParseErrorCode =
  | 'EMPTY_COMMAND'
  | 'NOT_CURL_COMMAND'
  | 'UNTERMINATED_QUOTE'
  | 'UNSUPPORTED_FLAG'
  | 'MISSING_FLAG_VALUE'
  | 'MISSING_URL'
  | 'MULTIPLE_URLS'
  | 'INVALID_URL'
  | 'INVALID_HEADER'
  | 'INVALID_METHOD';

export interface CurlHeader {
  name: string;
  value: string;
}

export interface ParsedCurlCommand {
  method: string;
  url: string;
  headers: CurlHeader[];
  body: string;
  auth: string | null;
  cookies: string[];
  options: {
    compressed: boolean;
    followRedirects: boolean;
    insecure: boolean;
    headOnly: boolean;
  };
}

export class CurlParseError extends Error {
  code: CurlParseErrorCode;
  flag?: string;
  token?: string;

  constructor(
    code: CurlParseErrorCode,
    message: string,
    details: { flag?: string; token?: string } = {},
  ) {
    super(message);
    this.name = 'CurlParseError';
    this.code = code;
    this.flag = details.flag;
    this.token = details.token;
  }
}

const VALUE_FLAGS = new Set([
  '-X',
  '--request',
  '-H',
  '--header',
  '-d',
  '--data',
  '--data-raw',
  '--data-binary',
  '--data-ascii',
  '--data-urlencode',
  '--url',
  '-u',
  '--user',
  '-A',
  '--user-agent',
  '-b',
  '--cookie',
]);

const BOOLEAN_FLAGS = new Set([
  '-I',
  '--head',
  '-i',
  '--include',
  '-k',
  '--insecure',
  '-L',
  '--location',
  '--compressed',
  '-s',
  '--silent',
  '-S',
  '--show-error',
  '-v',
  '--verbose',
]);

export function parseCurlCommand(command: string): ParsedCurlCommand {
  const tokens = tokenizeCurlCommand(command);

  if (tokens.length === 0) {
    throw new CurlParseError('EMPTY_COMMAND', 'curl 명령어를 입력해주세요.');
  }

  if (tokens[0] !== 'curl') {
    throw new CurlParseError('NOT_CURL_COMMAND', '명령어는 curl로 시작해야 합니다.', {
      token: tokens[0],
    });
  }

  let explicitMethod: string | null = null;
  let url: string | null = null;
  const headers: CurlHeader[] = [];
  const dataParts: string[] = [];
  const cookies: string[] = [];
  let auth: string | null = null;
  const options: ParsedCurlCommand['options'] = {
    compressed: false,
    followRedirects: false,
    insecure: false,
    headOnly: false,
  };

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    const splitFlag = splitLongFlagAssignment(token);
    const flag = splitFlag?.flag ?? normalizeShortFlag(token);

    if (splitFlag || VALUE_FLAGS.has(flag)) {
      const hasInlineShortValue = !splitFlag && hasShortFlagInlineValue(token, flag);
      const value =
        splitFlag?.value ?? getFlagValue(tokens, index, flag, shouldTreatNextTokenAsValue(flag));

      if (!splitFlag && !hasInlineShortValue) {
        index += 1;
      }

      if (flag === '-X' || flag === '--request') {
        explicitMethod = normalizeMethod(value);
      } else if (flag === '-H' || flag === '--header') {
        headers.push(parseHeader(value));
      } else if (isDataFlag(flag)) {
        dataParts.push(value);
      } else if (flag === '--url') {
        url = setUrl(url, value);
      } else if (flag === '-u' || flag === '--user') {
        auth = value;
      } else if (flag === '-A' || flag === '--user-agent') {
        headers.push({ name: 'User-Agent', value });
      } else if (flag === '-b' || flag === '--cookie') {
        cookies.push(value);
        headers.push({ name: 'Cookie', value });
      }

      continue;
    }

    if (BOOLEAN_FLAGS.has(flag)) {
      if (flag === '-I' || flag === '--head') {
        options.headOnly = true;
        explicitMethod ??= 'HEAD';
      } else if (flag === '-k' || flag === '--insecure') {
        options.insecure = true;
      } else if (flag === '-L' || flag === '--location') {
        options.followRedirects = true;
      } else if (flag === '--compressed') {
        options.compressed = true;
      }

      continue;
    }

    if (token.startsWith('-')) {
      throw new CurlParseError(
        'UNSUPPORTED_FLAG',
        `${token} 옵션은 아직 지원하지 않는 curl 옵션입니다.`,
        { flag: token },
      );
    }

    url = setUrl(url, token);
  }

  if (!url) {
    throw new CurlParseError('MISSING_URL', '요청 URL을 찾을 수 없습니다.');
  }

  validateUrl(url);

  return {
    method: explicitMethod ?? (dataParts.length > 0 ? 'POST' : 'GET'),
    url,
    headers,
    body: dataParts.join('&'),
    auth,
    cookies,
    options,
  };
}

function tokenizeCurlCommand(command: string) {
  const normalizedCommand = command.replace(/\\\r?\n/g, ' ');
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < normalizedCommand.length; index += 1) {
    const character = normalizedCommand[index];

    if (quote) {
      if (character === quote) {
        quote = null;
      } else if (character === '\\' && quote === '"') {
        index += 1;
        current += normalizedCommand[index] ?? '';
      } else {
        current += character;
      }

      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    if (character === '\\') {
      index += 1;
      current += normalizedCommand[index] ?? '';
      continue;
    }

    current += character;
  }

  if (quote) {
    throw new CurlParseError(
      'UNTERMINATED_QUOTE',
      'curl 명령어의 따옴표가 닫히지 않았습니다.',
    );
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function splitLongFlagAssignment(token: string) {
  if (!token.startsWith('--') || !token.includes('=')) {
    return null;
  }

  const assignmentIndex = token.indexOf('=');
  const flag = token.slice(0, assignmentIndex);
  const value = token.slice(assignmentIndex + 1);

  if (!VALUE_FLAGS.has(flag)) {
    throw new CurlParseError(
      'UNSUPPORTED_FLAG',
      `${flag} 옵션은 아직 지원하지 않는 curl 옵션입니다.`,
      { flag },
    );
  }

  if (!value) {
    throw new CurlParseError('MISSING_FLAG_VALUE', `${flag} 옵션에는 값이 필요합니다.`, {
      flag,
    });
  }

  return { flag, value };
}

function normalizeShortFlag(token: string) {
  if (/^-X.+/.test(token)) return '-X';
  if (/^-H.+/.test(token)) return '-H';
  if (/^-d.+/.test(token)) return '-d';
  if (/^-u.+/.test(token)) return '-u';
  if (/^-A.+/.test(token)) return '-A';
  if (/^-b.+/.test(token)) return '-b';
  return token;
}

function hasShortFlagInlineValue(token: string, flag: string) {
  return flag.startsWith('-') && !flag.startsWith('--') && token !== flag && token.startsWith(flag);
}

function getFlagValue(
  tokens: string[],
  flagIndex: number,
  flag: string,
  treatNextTokenAsValue: (nextToken: string) => boolean = (nextToken) => !nextToken.startsWith('-'),
) {
  const currentToken = tokens[flagIndex];
  const inlineValue = currentToken.startsWith(flag) ? currentToken.slice(flag.length) : '';

  if (inlineValue) {
    return inlineValue;
  }

  const nextToken = tokens[flagIndex + 1];

  if (!nextToken || !treatNextTokenAsValue(nextToken)) {
    throw new CurlParseError('MISSING_FLAG_VALUE', `${flag} 옵션에는 값이 필요합니다.`, {
      flag,
    });
  }

  return nextToken;
}

function shouldTreatNextTokenAsValue(flag: string) {
  return (nextToken: string) => {
    if (nextToken.startsWith('-')) return false;
    if ((flag === '-H' || flag === '--header') && isLikelyUrl(nextToken)) return false;
    return true;
  };
}

function parseHeader(rawHeader: string): CurlHeader {
  const separatorIndex = rawHeader.indexOf(':');

  if (separatorIndex <= 0) {
    throw new CurlParseError(
      'INVALID_HEADER',
      '헤더는 "이름: 값" 형식이어야 합니다.',
      { token: rawHeader },
    );
  }

  const name = rawHeader.slice(0, separatorIndex).trim();
  const value = rawHeader.slice(separatorIndex + 1).trim();

  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) {
    throw new CurlParseError('INVALID_HEADER', '헤더 이름에 사용할 수 없는 문자가 있습니다.', {
      token: rawHeader,
    });
  }

  return { name, value };
}

function normalizeMethod(method: string) {
  const normalizedMethod = method.toUpperCase();

  if (!/^[A-Z]+$/.test(normalizedMethod)) {
    throw new CurlParseError('INVALID_METHOD', 'HTTP 메서드는 영문자로 입력해주세요.', {
      token: method,
    });
  }

  return normalizedMethod;
}

function setUrl(currentUrl: string | null, nextUrl: string) {
  if (currentUrl) {
    throw new CurlParseError('MULTIPLE_URLS', '요청 URL은 하나만 입력할 수 있습니다.', {
      token: nextUrl,
    });
  }

  return nextUrl;
}

function validateUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('unsupported-protocol');
    }
  } catch {
    throw new CurlParseError(
      'INVALID_URL',
      'URL은 http:// 또는 https://로 시작하는 올바른 주소여야 합니다.',
      { token: url },
    );
  }
}

function isDataFlag(flag: string) {
  return (
    flag === '-d' ||
    flag === '--data' ||
    flag === '--data-raw' ||
    flag === '--data-binary' ||
    flag === '--data-ascii' ||
    flag === '--data-urlencode'
  );
}

function isLikelyUrl(value: string) {
  return /^https?:\/\//i.test(value);
}
