import { parseCurlCommand, type CurlHeader, type ParsedCurlCommand } from './curl-parser.ts';

export type CurlToCodeLanguage =
  | 'javascript-fetch'
  | 'node-fetch'
  | 'python-requests'
  | 'php-curl';

export interface CurlToCodeOptions {
  language: CurlToCodeLanguage | string;
  indentSize?: number;
  includeTimeout?: boolean;
  timeoutSeconds?: number;
  includeComments?: boolean;
  includeAsyncWrapper?: boolean;
  redactSensitiveValues?: boolean;
}

export interface CurlToCodeResult {
  code: string;
  language: CurlToCodeLanguage;
  languageLabel: string;
  summary: string;
  warnings: string[];
}

export interface CurlToCodeLanguageOption {
  id: CurlToCodeLanguage;
  label: string;
  description: string;
}

const LANGUAGES: CurlToCodeLanguageOption[] = [
  {
    id: 'javascript-fetch',
    label: 'JavaScript fetch',
    description: '브라우저 또는 최신 런타임에서 사용하는 fetch 코드',
  },
  {
    id: 'node-fetch',
    label: 'Node.js fetch',
    description: 'Node.js 18+의 전역 fetch 기반 코드',
  },
  {
    id: 'python-requests',
    label: 'Python requests',
    description: 'requests 패키지를 사용하는 Python 코드',
  },
  {
    id: 'php-curl',
    label: 'PHP cURL',
    description: 'curl_setopt 기반 PHP 코드',
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

export function getCurlToCodeLanguages() {
  return LANGUAGES;
}

export function generateCodeFromCurl(
  command: string,
  options: CurlToCodeOptions,
): CurlToCodeResult {
  const normalizedOptions = normalizeOptions(options);
  const parsedCommand = parseCurlCommand(command);
  const headers = normalizeHeaders(parsedCommand.headers, normalizedOptions.redactSensitiveValues);
  const warnings = buildWarnings(parsedCommand, headers, normalizedOptions);
  const languageLabel = getLanguageLabel(normalizedOptions.language);

  return {
    code: buildCode(parsedCommand, headers, normalizedOptions),
    language: normalizedOptions.language,
    languageLabel,
    summary: `${parsedCommand.method} ${parsedCommand.url}`,
    warnings,
  };
}

type NormalizedCurlToCodeOptions = Required<
  Pick<
    CurlToCodeOptions,
    | 'language'
    | 'indentSize'
    | 'includeTimeout'
    | 'timeoutSeconds'
    | 'includeComments'
    | 'includeAsyncWrapper'
    | 'redactSensitiveValues'
  >
> & {
  language: CurlToCodeLanguage;
};

interface PreparedHeader extends CurlHeader {
  wasRedacted: boolean;
}

function normalizeOptions(options: CurlToCodeOptions): NormalizedCurlToCodeOptions {
  if (!options || typeof options !== 'object') {
    throw new Error('코드 생성 옵션을 확인해주세요.');
  }

  if (!LANGUAGES.some((language) => language.id === options.language)) {
    throw new Error('지원하지 않는 대상 언어입니다.');
  }

  const indentSize = options.indentSize ?? 2;
  if (!Number.isFinite(indentSize) || indentSize < 2 || indentSize > 8) {
    throw new Error('들여쓰기는 2~8칸 사이의 숫자로 입력해주세요.');
  }

  const timeoutSeconds = options.timeoutSeconds ?? 30;
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1) {
    throw new Error('타임아웃은 1초 이상이어야 합니다.');
  }

  if (timeoutSeconds > 600) {
    throw new Error('타임아웃은 600초 이하로 입력해주세요.');
  }

  return {
    language: options.language as CurlToCodeLanguage,
    indentSize,
    includeTimeout: options.includeTimeout ?? true,
    timeoutSeconds,
    includeComments: options.includeComments ?? false,
    includeAsyncWrapper: options.includeAsyncWrapper ?? false,
    redactSensitiveValues: options.redactSensitiveValues ?? false,
  };
}

function normalizeHeaders(headers: CurlHeader[], redactSensitiveValues: boolean): PreparedHeader[] {
  return headers.map((header) => {
    const sensitive = isSensitiveHeader(header.name);

    return {
      name: header.name,
      value: sensitive && redactSensitiveValues ? `<${toPlaceholderName(header.name)}_VALUE>` : header.value,
      wasRedacted: sensitive && redactSensitiveValues,
    };
  });
}

function buildWarnings(
  parsedCommand: ParsedCurlCommand,
  headers: PreparedHeader[],
  options: NormalizedCurlToCodeOptions,
) {
  const warnings: string[] = [];
  const redactedHeaders = headers.filter((header) => header.wasRedacted);

  if (redactedHeaders.length > 0) {
    warnings.push(
      `민감할 수 있는 헤더(${redactedHeaders.map((header) => header.name).join(', ')})를 자리표시자로 대체했습니다.`,
    );
  }

  if (parsedCommand.options.insecure) {
    warnings.push('curl의 -k/--insecure 옵션은 생성 코드에 반영하지 않았습니다. TLS 검증 비활성화는 권장하지 않습니다.');
  }

  if (parsedCommand.options.compressed && options.language === 'php-curl') {
    warnings.push('압축 응답 처리를 위해 PHP cURL에 CURLOPT_ENCODING 옵션을 추가했습니다.');
  }

  if (parsedCommand.auth) {
    warnings.push('curl 사용자 인증 값은 Authorization 헤더로 직접 변환하지 않았습니다. 필요한 인증 방식을 코드에 직접 반영해주세요.');
  }

  return warnings;
}

function buildCode(
  parsedCommand: ParsedCurlCommand,
  headers: PreparedHeader[],
  options: NormalizedCurlToCodeOptions,
) {
  if (options.language === 'python-requests') {
    return buildPythonRequests(parsedCommand, headers, options);
  }

  if (options.language === 'php-curl') {
    return buildPhpCurl(parsedCommand, headers, options);
  }

  return buildJavaScriptFetch(parsedCommand, headers, options);
}

function buildJavaScriptFetch(
  parsedCommand: ParsedCurlCommand,
  headers: PreparedHeader[],
  options: NormalizedCurlToCodeOptions,
) {
  const lines: string[] = [];
  const indent = makeIndent(options.indentSize);
  const innerIndent = options.includeAsyncWrapper ? indent : '';

  if (options.includeComments) {
    lines.push('// ConvertApp에서 생성한 코드입니다. 민감한 값은 실행 전에 확인하세요.');
  }

  if (options.includeAsyncWrapper) {
    lines.push('async function runRequest() {');
  }

  if (options.includeTimeout) {
    lines.push(`${innerIndent}const controller = new AbortController();`);
    lines.push(
      `${innerIndent}const timeoutId = setTimeout(() => controller.abort(), ${options.timeoutSeconds * 1000});`,
    );
    lines.push('');
    lines.push(`${innerIndent}try {`);
  }

  const fetchIndent = options.includeTimeout ? `${innerIndent}${indent}` : innerIndent;
  const requestOptions = buildJavaScriptFetchOptions(parsedCommand, headers, options, fetchIndent);
  lines.push(`${fetchIndent}const response = await fetch(${quoteJs(parsedCommand.url)}, ${requestOptions});`);
  lines.push(`${fetchIndent}const data = await response.text();`);
  lines.push(`${fetchIndent}return data;`);

  if (options.includeTimeout) {
    lines.push(`${innerIndent}} finally {`);
    lines.push(`${innerIndent}${indent}clearTimeout(timeoutId);`);
    lines.push(`${innerIndent}}`);
  }

  if (options.includeAsyncWrapper) {
    lines.push('}');
    lines.push('');
    lines.push('runRequest();');
  }

  return lines.join('\n');
}

function buildJavaScriptFetchOptions(
  parsedCommand: ParsedCurlCommand,
  headers: PreparedHeader[],
  options: NormalizedCurlToCodeOptions,
  baseIndent: string,
) {
  const indent = makeIndent(options.indentSize);
  const lines = ['{'];

  lines.push(`${baseIndent}${indent}method: ${quoteJs(parsedCommand.method)},`);

  if (headers.length > 0) {
    lines.push(`${baseIndent}${indent}headers: {`);
    headers.forEach((header) => {
      lines.push(`${baseIndent}${indent}${indent}${quoteJs(header.name)}: ${quoteJs(header.value)},`);
    });
    lines.push(`${baseIndent}${indent}},`);
  }

  if (parsedCommand.body) {
    lines.push(`${baseIndent}${indent}body: ${quoteJs(parsedCommand.body)},`);
  }

  if (parsedCommand.options.followRedirects) {
    lines.push(`${baseIndent}${indent}redirect: 'follow',`);
  }

  if (options.includeTimeout) {
    lines.push(`${baseIndent}${indent}signal: controller.signal,`);
  }

  lines.push(`${baseIndent}}`);
  return lines.join('\n');
}

function buildPythonRequests(
  parsedCommand: ParsedCurlCommand,
  headers: PreparedHeader[],
  options: NormalizedCurlToCodeOptions,
) {
  const indent = makeIndent(options.indentSize);
  const lines = ['import requests'];
  const jsonBody = getJsonBody(parsedCommand, headers);

  if (jsonBody) {
    lines.push('');
    lines.push(`payload = ${toPythonLiteral(jsonBody, 0, options.indentSize)}`);
  }

  if (headers.length > 0) {
    lines.push('');
    lines.push(`headers = ${toPythonLiteral(toHeaderRecord(headers), 0, options.indentSize)}`);
  }

  lines.push('');
  lines.push('response = requests.request(');
  lines.push(`${indent}method=${quotePython(parsedCommand.method)},`);
  lines.push(`${indent}url=${quotePython(parsedCommand.url)},`);

  if (headers.length > 0) {
    lines.push(`${indent}headers=headers,`);
  }

  if (parsedCommand.body) {
    if (jsonBody) {
      lines.push(`${indent}json=payload,`);
    } else {
      lines.push(`${indent}data=${quotePython(parsedCommand.body)},`);
    }
  }

  if (parsedCommand.options.followRedirects) {
    lines.push(`${indent}allow_redirects=True,`);
  }

  if (options.includeTimeout) {
    lines.push(`${indent}timeout=${options.timeoutSeconds},`);
  }

  lines.push(')');
  lines.push('');
  lines.push('print(response.text)');

  if (options.includeComments) {
    lines.unshift('# ConvertApp에서 생성한 코드입니다. 민감한 값은 실행 전에 확인하세요.');
  }

  return lines.join('\n');
}

function buildPhpCurl(
  parsedCommand: ParsedCurlCommand,
  headers: PreparedHeader[],
  options: NormalizedCurlToCodeOptions,
) {
  const indent = makeIndent(options.indentSize);
  const lines = ['<?php'];

  if (options.includeComments) {
    lines.push('// ConvertApp에서 생성한 코드입니다. 민감한 값은 실행 전에 확인하세요.');
  }

  lines.push(`$ch = curl_init(${quotePhp(parsedCommand.url)});`);
  lines.push('');
  lines.push('curl_setopt_array($ch, [');
  lines.push(`${indent}CURLOPT_RETURNTRANSFER => true,`);
  lines.push(`${indent}CURLOPT_CUSTOMREQUEST => ${quotePhp(parsedCommand.method)},`);

  if (headers.length > 0) {
    lines.push(`${indent}CURLOPT_HTTPHEADER => [`);
    headers.forEach((header) => {
      lines.push(`${indent}${indent}${quotePhp(`${header.name}: ${header.value}`)},`);
    });
    lines.push(`${indent}],`);
  }

  if (parsedCommand.body) {
    lines.push(`${indent}CURLOPT_POSTFIELDS => ${quotePhp(parsedCommand.body)},`);
  }

  if (parsedCommand.options.followRedirects) {
    lines.push(`${indent}CURLOPT_FOLLOWLOCATION => true,`);
  }

  if (parsedCommand.options.compressed) {
    lines.push(`${indent}CURLOPT_ENCODING => '',`);
  }

  if (options.includeTimeout) {
    lines.push(`${indent}CURLOPT_TIMEOUT => ${options.timeoutSeconds},`);
  }

  lines.push(']);');
  lines.push('');
  lines.push('$response = curl_exec($ch);');
  lines.push('');
  lines.push('if ($response === false) {');
  lines.push(`${indent}throw new RuntimeException(curl_error($ch));`);
  lines.push('}');
  lines.push('');
  lines.push('curl_close($ch);');
  lines.push('echo $response;');

  return lines.join('\n');
}

function getJsonBody(parsedCommand: ParsedCurlCommand, headers: PreparedHeader[]) {
  if (!parsedCommand.body) {
    return null;
  }

  const contentType = headers.find(
    (header) => header.name.toLowerCase() === 'content-type',
  )?.value;

  if (!contentType?.toLowerCase().includes('application/json')) {
    return null;
  }

  try {
    return JSON.parse(parsedCommand.body) as unknown;
  } catch {
    return null;
  }
}

function toHeaderRecord(headers: PreparedHeader[]) {
  return headers.reduce<Record<string, string>>((record, header) => {
    record[header.name] = header.value;
    return record;
  }, {});
}

function toPythonLiteral(value: unknown, level: number, indentSize: number): string {
  const indent = makeIndent(indentSize);
  const currentIndent = indent.repeat(level);
  const nextIndent = indent.repeat(level + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value
      .map((item) => `${nextIndent}${toPythonLiteral(item, level + 1, indentSize)}`)
      .join(',\n')}\n${currentIndent}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return `{\n${entries
      .map(
        ([key, item]) =>
          `${nextIndent}${quotePython(key)}: ${toPythonLiteral(item, level + 1, indentSize)}`,
      )
      .join(',\n')}\n${currentIndent}}`;
  }

  if (typeof value === 'string') return quotePython(value);
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return 'None';
}

function getLanguageLabel(languageId: CurlToCodeLanguage) {
  return LANGUAGES.find((language) => language.id === languageId)?.label ?? languageId;
}

function isSensitiveHeader(name: string) {
  return SENSITIVE_HEADER_NAMES.has(name.toLowerCase());
}

function toPlaceholderName(name: string) {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function makeIndent(size: number) {
  return ' '.repeat(size);
}

function quoteJs(value: string) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;
}

function quotePython(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`;
}

function quotePhp(value: string) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;
}
