export type CodeToCurlInputLanguage = 'javascript-fetch' | 'python-requests' | 'http';

export interface CodeToCurlOptions {
  language: CodeToCurlInputLanguage | string;
  multiline?: boolean;
  includeCompressed?: boolean;
  followRedirects?: boolean;
  includeTimeout?: boolean;
  redactSensitiveValues?: boolean;
}

export interface CodeToCurlResult {
  command: string;
  language: CodeToCurlInputLanguage;
  languageLabel: string;
  summary: string;
  warnings: string[];
}

export interface CodeToCurlInputLanguageOption {
  id: CodeToCurlInputLanguage;
  label: string;
  description: string;
}

interface RequestModel {
  method: string;
  url: string;
  headers: Array<{ name: string; value: string; wasRedacted?: boolean }>;
  body: string | null;
  timeoutSeconds: number | null;
  warnings: string[];
}

type NormalizedOptions = Required<
  Pick<
    CodeToCurlOptions,
    'language' | 'multiline' | 'includeCompressed' | 'followRedirects' | 'includeTimeout' | 'redactSensitiveValues'
  >
> & {
  language: CodeToCurlInputLanguage;
};

const INPUT_LANGUAGES: CodeToCurlInputLanguageOption[] = [
  {
    id: 'javascript-fetch',
    label: 'JavaScript fetch',
    description: 'fetch(url, options) 형태의 브라우저/Node.js 요청 코드',
  },
  {
    id: 'python-requests',
    label: 'Python requests',
    description: 'requests.get/post/put/delete 호출 스니펫',
  },
  {
    id: 'http',
    label: 'Raw HTTP',
    description: 'HTTP 요청 라인, 헤더, 본문으로 구성된 원문 요청',
  },
];

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'set-cookie',
  'x-api-key',
  'api-key',
  'x-auth-token',
]);

export function getCodeToCurlInputLanguages() {
  return INPUT_LANGUAGES;
}

export function convertCodeToCurl(snippet: string, options: CodeToCurlOptions): CodeToCurlResult {
  const normalizedOptions = normalizeOptions(options);
  const normalizedSnippet = normalizeSnippet(snippet);
  const request = parseRequest(normalizedSnippet, normalizedOptions);
  validateAbsoluteUrl(request.url);

  const warnings = [...request.warnings];
  const headers = normalizeHeaders(request.headers, normalizedOptions.redactSensitiveValues);
  const redactedHeaders = headers.filter((header) => header.wasRedacted);

  if (redactedHeaders.length > 0) {
    warnings.push(
      `민감할 수 있는 헤더(${redactedHeaders.map((header) => header.name).join(', ')})를 자리표시자로 대체했습니다.`,
    );
  }

  return {
    command: buildCurlCommand(request, headers, normalizedOptions),
    language: normalizedOptions.language,
    languageLabel: getLanguageLabel(normalizedOptions.language),
    summary: `${request.method} ${request.url}`,
    warnings,
  };
}

function normalizeOptions(options: CodeToCurlOptions): NormalizedOptions {
  if (!options || typeof options !== 'object') {
    throw new Error('변환 옵션을 확인해주세요.');
  }

  if (!INPUT_LANGUAGES.some((language) => language.id === options.language)) {
    throw new Error('지원하지 않는 입력 언어입니다.');
  }

  return {
    language: options.language as CodeToCurlInputLanguage,
    multiline: options.multiline ?? true,
    includeCompressed: options.includeCompressed ?? false,
    followRedirects: options.followRedirects ?? false,
    includeTimeout: options.includeTimeout ?? true,
    redactSensitiveValues: options.redactSensitiveValues ?? true,
  };
}

function normalizeSnippet(snippet: string) {
  if (typeof snippet !== 'string' || snippet.trim().length === 0) {
    throw new Error('변환할 코드 스니펫을 입력해주세요.');
  }

  return snippet.trim();
}

function parseRequest(snippet: string, options: NormalizedOptions): RequestModel {
  if (options.language === 'python-requests') {
    return parsePythonRequestsSnippet(snippet);
  }

  if (options.language === 'http') {
    return parseRawHttpSnippet(snippet);
  }

  return parseJavaScriptFetchSnippet(snippet);
}

function parseJavaScriptFetchSnippet(snippet: string): RequestModel {
  const fetchIndex = snippet.search(/\bfetch\s*\(/);

  if (fetchIndex === -1) {
    throw new Error('JavaScript fetch 호출을 찾을 수 없습니다. fetch(url, options) 형태의 코드를 입력해주세요.');
  }

  const callStart = snippet.indexOf('(', fetchIndex);
  const callBody = readBalanced(snippet, callStart, '(', ')', 'fetch 호출의 괄호가 닫히지 않았습니다.');
  const args = splitTopLevel(callBody, ',');
  const url = parseStringLiteral(args[0] ?? '', 'fetch 첫 번째 인자는 URL 문자열이어야 합니다.');
  const optionsObject = args[1] ?? '';
  const method = parseObjectStringProperty(optionsObject, 'method') ?? 'GET';
  const headers = parseJavaScriptHeaders(optionsObject);
  const body = parseJavaScriptBody(optionsObject);

  return {
    method: body && method === 'GET' ? 'POST' : method.toUpperCase(),
    url,
    headers,
    body,
    timeoutSeconds: null,
    warnings: [],
  };
}

function parsePythonRequestsSnippet(snippet: string): RequestModel {
  const callMatch = snippet.match(/\brequests\.(get|post|put|patch|delete|head|options)\s*\(/i);

  if (!callMatch || callMatch.index === undefined) {
    throw new Error('Python requests 호출을 찾을 수 없습니다. requests.get(...) 또는 requests.post(...) 형태로 입력해주세요.');
  }

  const callStart = snippet.indexOf('(', callMatch.index);
  const callBody = readBalanced(snippet, callStart, '(', ')', 'requests 호출의 괄호가 닫히지 않았습니다.');
  const args = splitTopLevel(callBody, ',').filter(Boolean);
  const url = parseStringLiteral(args[0] ?? '', 'requests 첫 번째 인자는 URL 문자열이어야 합니다.');
  const keywordArgs = parseKeywordArguments(args.slice(1));
  const params = keywordArgs.get('params');
  const headers = parsePythonHeaders(keywordArgs.get('headers'));
  const jsonBody = keywordArgs.get('json');
  const dataBody = keywordArgs.get('data');
  const timeout = keywordArgs.get('timeout');
  const allowRedirects = keywordArgs.get('allow_redirects');
  const body = jsonBody ? normalizePythonLiteralToJson(jsonBody) : normalizePythonData(dataBody);
  const nextHeaders = [...headers];
  const warnings: string[] = [];

  if (jsonBody && !hasHeader(nextHeaders, 'Content-Type')) {
    nextHeaders.push({ name: 'Content-Type', value: 'application/json' });
  }

  if (allowRedirects && /^false$/i.test(allowRedirects.trim())) {
    warnings.push('allow_redirects=False 설정은 curl 기본 동작과 같으므로 별도 옵션을 추가하지 않았습니다.');
  }

  return {
    method: callMatch[1].toUpperCase(),
    url: appendParams(url, params),
    headers: nextHeaders,
    body,
    timeoutSeconds: timeout ? parsePositiveNumber(timeout, 'timeout 값은 1초 이상의 숫자여야 합니다.') : null,
    warnings,
  };
}

function parseRawHttpSnippet(snippet: string): RequestModel {
  const normalized = snippet.replace(/\r\n/g, '\n');
  const [head, ...bodyParts] = normalized.split(/\n\n/);
  const lines = head.split('\n').map((line) => line.trimEnd()).filter(Boolean);
  const requestLine = lines.shift() ?? '';
  const requestMatch = requestLine.match(/^([A-Z]+)\s+(\S+)\s+HTTP\/\d(?:\.\d)?$/);

  if (!requestMatch) {
    throw new Error('HTTP 요청 라인은 "GET /path HTTP/1.1" 형식이어야 합니다.');
  }

  const headers = lines.map(parseRawHeaderLine);
  const host = headers.find((header) => header.name.toLowerCase() === 'host')?.value;

  if (!host) {
    throw new Error('Raw HTTP 요청에는 Host 헤더가 필요합니다.');
  }

  return {
    method: requestMatch[1],
    url: buildHttpUrl(host, requestMatch[2]),
    headers: headers.filter((header) => header.name.toLowerCase() !== 'host'),
    body: bodyParts.join('\n\n').trim() || null,
    timeoutSeconds: null,
    warnings: [],
  };
}

function parseRawHeaderLine(line: string) {
  const separatorIndex = line.indexOf(':');

  if (separatorIndex <= 0) {
    throw new Error('HTTP 헤더는 "이름: 값" 형식이어야 합니다.');
  }

  return {
    name: line.slice(0, separatorIndex).trim(),
    value: line.slice(separatorIndex + 1).trim(),
  };
}

function buildCurlCommand(
  request: RequestModel,
  headers: RequestModel['headers'],
  options: NormalizedOptions,
) {
  const segments = ['curl'];

  segments.push(`-X ${request.method}`);
  segments.push(shellQuote(request.url));

  headers.forEach((header) => {
    segments.push(`-H ${shellQuote(`${header.name}: ${header.value}`)}`);
  });

  if (request.body) {
    segments.push(`--data-raw ${shellQuote(request.body)}`);
  }

  if (options.followRedirects) {
    segments.push('--location');
  }

  if (options.includeCompressed) {
    segments.push('--compressed');
  }

  if (options.includeTimeout && request.timeoutSeconds) {
    segments.push(`--max-time ${request.timeoutSeconds}`);
  }

  if (!options.multiline) {
    return segments.join(' ');
  }

  const [command, ...rest] = segments;
  return [command, ...rest.map((part) => `  ${part}`)].join(' \\\n');
}

function parseJavaScriptHeaders(optionsObject: string) {
  const objectText = parseObjectProperty(optionsObject, 'headers');

  if (!objectText) {
    return [];
  }

  if (objectText.trim().startsWith('new Headers')) {
    throw new Error('new Headers(...) 형태는 아직 지원하지 않습니다. 일반 객체 헤더로 입력해주세요.');
  }

  return parseKeyValueObject(objectText, 'JavaScript headers 객체를 해석할 수 없습니다.');
}

function parseJavaScriptBody(optionsObject: string) {
  const bodyText = parseObjectProperty(optionsObject, 'body');

  if (!bodyText) {
    return null;
  }

  const trimmed = bodyText.trim();
  const jsonStringifyMatch = trimmed.match(/^JSON\.stringify\s*\(/);

  if (jsonStringifyMatch) {
    const start = trimmed.indexOf('(');
    const inner = readBalanced(trimmed, start, '(', ')', 'JSON.stringify 호출의 괄호가 닫히지 않았습니다.');
    return normalizeJavaScriptLiteralToJson(inner);
  }

  return parseStringLiteral(trimmed, 'body 값은 문자열 또는 JSON.stringify(...) 형태여야 합니다.');
}

function parseObjectStringProperty(objectText: string, propertyName: string) {
  const property = parseObjectProperty(objectText, propertyName);
  return property ? parseStringLiteral(property, `${propertyName} 값은 문자열이어야 합니다.`) : null;
}

function parseObjectProperty(objectText: string, propertyName: string) {
  const properties = splitTopLevel(stripWrappingBraces(objectText), ',');

  for (const property of properties) {
    const separatorIndex = findTopLevelSeparator(property, ':');
    if (separatorIndex === -1) continue;

    const key = property.slice(0, separatorIndex).trim().replace(/^['"]|['"]$/g, '');
    if (key === propertyName) {
      return property.slice(separatorIndex + 1).trim();
    }
  }

  return null;
}

function parseKeyValueObject(objectText: string, errorMessage: string) {
  const properties = splitTopLevel(stripWrappingBraces(objectText), ',');
  const values: Array<{ name: string; value: string }> = [];

  for (const property of properties) {
    if (!property.trim()) continue;

    const separatorIndex = findTopLevelSeparator(property, ':');
    if (separatorIndex === -1) {
      throw new Error(errorMessage);
    }

    const name = parseObjectKey(property.slice(0, separatorIndex).trim(), errorMessage);
    const value = parseStringLiteral(property.slice(separatorIndex + 1).trim(), errorMessage);
    values.push({ name, value });
  }

  return values;
}

function parsePythonHeaders(headersText?: string) {
  if (!headersText) {
    return [];
  }

  return parseKeyValueObject(headersText, 'Python headers 딕셔너리를 해석할 수 없습니다.');
}

function parseKeywordArguments(args: string[]) {
  const keywordArgs = new Map<string, string>();

  args.forEach((arg) => {
    const separatorIndex = findTopLevelSeparator(arg, '=');
    if (separatorIndex === -1) return;

    const name = arg.slice(0, separatorIndex).trim();
    const value = arg.slice(separatorIndex + 1).trim();

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && value) {
      keywordArgs.set(name, value);
    }
  });

  return keywordArgs;
}

function normalizePythonData(dataText?: string) {
  if (!dataText) {
    return null;
  }

  const trimmed = dataText.trim();

  if (trimmed.startsWith('{')) {
    return normalizePythonLiteralToJson(trimmed);
  }

  return parseStringLiteral(trimmed, 'data 값은 문자열 또는 딕셔너리 형태여야 합니다.');
}

function normalizeJavaScriptLiteralToJson(literal: string) {
  return normalizeLooseObjectLiteral(literal, 'JavaScript 객체 본문을 JSON으로 변환할 수 없습니다.');
}

function normalizePythonLiteralToJson(literal: string) {
  const normalized = literal
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null');

  return normalizeLooseObjectLiteral(normalized, 'Python 딕셔너리 본문을 JSON으로 변환할 수 없습니다.');
}

function normalizeLooseObjectLiteral(literal: string, errorMessage: string) {
  const normalized = literal
    .trim()
    .replace(/([{,]\s*)([A-Za-z_$][\w$-]*)(\s*:)/g, '$1"$2"$3')
    .replace(/'/g, '"')
    .replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.stringify(JSON.parse(normalized));
  } catch {
    throw new Error(errorMessage);
  }
}

function appendParams(url: string, paramsText?: string) {
  if (!paramsText) {
    return url;
  }

  const params = parseLooseRecord(paramsText, 'params 딕셔너리를 URL 쿼리로 변환할 수 없습니다.');
  const nextUrl = new URL(url);

  Object.entries(params).forEach(([key, value]) => {
    nextUrl.searchParams.set(key, String(value));
  });

  return nextUrl.toString().replace(/\+/g, '%20');
}

function parseLooseRecord(literal: string, errorMessage: string) {
  const normalized = normalizePythonLiteralToJson(literal);

  try {
    const value = JSON.parse(normalized);

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(errorMessage);
    }

    return value as Record<string, string | number | boolean>;
  } catch {
    throw new Error(errorMessage);
  }
}

function normalizeHeaders(headers: RequestModel['headers'], redactSensitiveValues: boolean) {
  return headers.map((header) => {
    const sensitive = isSensitiveHeader(header.name);

    return {
      ...header,
      value: sensitive && redactSensitiveValues ? `<${toPlaceholderName(header.name)}_VALUE>` : header.value,
      wasRedacted: sensitive && redactSensitiveValues,
    };
  });
}

function hasHeader(headers: RequestModel['headers'], name: string) {
  return headers.some((header) => header.name.toLowerCase() === name.toLowerCase());
}

function parseStringLiteral(value: string, errorMessage: string) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote !== '"' && quote !== "'") || trimmed[trimmed.length - 1] !== quote) {
    throw new Error(errorMessage);
  }

  return trimmed.slice(1, -1).replace(/\\(["'\\])/g, '$1');
}

function parseObjectKey(value: string, errorMessage: string) {
  if (value.startsWith('"') || value.startsWith("'")) {
    return parseStringLiteral(value, errorMessage);
  }

  if (/^[A-Za-z_$][\w$-]*$/.test(value)) {
    return value;
  }

  throw new Error(errorMessage);
}

function readBalanced(source: string, startIndex: number, open: string, close: string, errorMessage: string) {
  let depth = 0;
  let quote: '"' | "'" | '`' | null = null;

  for (let index = startIndex; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }

    if (character === open) {
      depth += 1;
    } else if (character === close) {
      depth -= 1;

      if (depth === 0) {
        return source.slice(startIndex + 1, index);
      }
    }
  }

  throw new Error(errorMessage);
}

function splitTopLevel(source: string, separator: ',' | '=') {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: '"' | "'" | '`' | null = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      current += character;

      if (character === '\\') {
        index += 1;
        current += source[index] ?? '';
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      current += character;
      continue;
    }

    if ('({['.includes(character)) depth += 1;
    if (')}]'.includes(character)) depth -= 1;

    if (character === separator && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function findTopLevelSeparator(source: string, separator: ':' | '=') {
  let depth = 0;
  let quote: '"' | "'" | '`' | null = null;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (character === '\\') {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }

    if ('({['.includes(character)) depth += 1;
    if (')}]'.includes(character)) depth -= 1;

    if (character === separator && depth === 0) {
      return index;
    }
  }

  return -1;
}

function stripWrappingBraces(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function buildHttpUrl(host: string, target: string) {
  if (/^https?:\/\//i.test(target)) {
    return target;
  }

  return `https://${host}${target.startsWith('/') ? target : `/${target}`}`;
}

function validateAbsoluteUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
  } catch {
    throw new Error('절대 URL만 curl로 변환할 수 있습니다. https:// 또는 http://로 시작하는 URL을 입력해주세요.');
  }
}

function parsePositiveNumber(value: string, errorMessage: string) {
  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(errorMessage);
  }

  return parsed;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function isSensitiveHeader(name: string) {
  return SENSITIVE_HEADER_NAMES.has(name.toLowerCase());
}

function toPlaceholderName(headerName: string) {
  return headerName.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function getLanguageLabel(language: CodeToCurlInputLanguage) {
  return INPUT_LANGUAGES.find((item) => item.id === language)?.label ?? language;
}
