export type EnvQuoteType = 'none' | 'single' | 'double';

export type EnvIssueCode =
  | 'EMPTY_INPUT'
  | 'MISSING_EQUALS'
  | 'EMPTY_KEY'
  | 'INVALID_KEY'
  | 'DUPLICATE_KEY'
  | 'UNQUOTED_SPACE'
  | 'UNCLOSED_QUOTE'
  | 'INVALID_ESCAPE'
  | 'TRAILING_CHARACTERS';

export interface EnvEntry {
  key: string;
  value: string;
  quote: EnvQuoteType;
  line: number;
  column: number;
  raw: string;
}

export interface EnvValidationIssue {
  code: EnvIssueCode;
  line: number;
  column: number;
  message: string;
  key?: string;
}

export interface EnvIssueFeedback {
  title: string;
  message: string;
  location: string;
  suggestion: string;
}

export interface EnvValidationResult {
  valid: boolean;
  entries: EnvEntry[];
  issues: EnvValidationIssue[];
  lineCount: number;
}

export type EnvValidationOutcome =
  | {
      ok: true;
      result: EnvValidationResult;
    }
  | {
      ok: false;
      error: string;
    };

const envKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
const supportedEscapes = new Map([
  ['n', '\n'],
  ['r', '\r'],
  ['t', '\t'],
  ['"', '"'],
  ['\\', '\\'],
  ['$', '$'],
]);

export function parseEnvContent(content: string): EnvValidationResult {
  if (typeof content !== 'string') {
    throw new Error('.env 내용은 텍스트로 입력해주세요.');
  }

  const entries: EnvEntry[] = [];
  const issues: EnvValidationIssue[] = [];
  const seenKeys = new Set<string>();
  const lines = content.replace(/\r\n?/g, '\n').split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const normalizedLine = stripExportPrefix(line);
    const equalsIndex = normalizedLine.indexOf('=');

    if (equalsIndex === -1) {
      issues.push(createIssue(
        'MISSING_EQUALS',
        lineNumber,
        firstNonWhitespaceColumn(line),
        '각 .env 항목은 KEY=VALUE 형식이어야 합니다.',
      ));
      return;
    }

    const rawKey = normalizedLine.slice(0, equalsIndex).trim();
    const valueSource = normalizedLine.slice(equalsIndex + 1);
    const keyColumn = normalizedLine.indexOf(rawKey) + 1;

    if (!rawKey) {
      issues.push(createIssue(
        'EMPTY_KEY',
        lineNumber,
        Math.max(1, equalsIndex),
        '변수 이름을 입력해주세요.',
      ));
      return;
    }

    if (!envKeyPattern.test(rawKey)) {
      issues.push(createIssue(
        'INVALID_KEY',
        lineNumber,
        keyColumn,
        '변수 이름은 영문자 또는 밑줄로 시작하고, 영문자/숫자/밑줄만 사용할 수 있습니다.',
        rawKey,
      ));
      return;
    }

    if (seenKeys.has(rawKey)) {
      issues.push(createIssue(
        'DUPLICATE_KEY',
        lineNumber,
        keyColumn,
        `${rawKey}는 중복된 변수 이름입니다. 하나의 .env 파일에서는 한 번만 선언해주세요.`,
        rawKey,
      ));
      return;
    }

    const parsedValue = parseEnvValue(valueSource, lineNumber, equalsIndex + 2);

    if (parsedValue.issues.length > 0) {
      issues.push(...parsedValue.issues.map((issue) => ({
        ...issue,
        key: rawKey,
      })));
      return;
    }

    seenKeys.add(rawKey);
    entries.push({
      key: rawKey,
      value: parsedValue.value,
      quote: parsedValue.quote,
      line: lineNumber,
      column: keyColumn,
      raw: line,
    });
  });

  if (entries.length === 0 && issues.length === 0) {
    issues.push(createIssue(
      'EMPTY_INPUT',
      1,
      1,
      '검사할 .env 변수를 입력해주세요.',
    ));
  }

  return {
    valid: issues.length === 0,
    entries,
    issues,
    lineCount: lines.length,
  };
}

export function safeParseEnvContent(content: unknown): EnvValidationOutcome {
  try {
    return {
      ok: true,
      result: parseEnvContent(content as string),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '.env 검사 중 오류가 발생했습니다.',
    };
  }
}

export function formatEnvValidationResult(result: EnvValidationResult) {
  const lines = [
    '.env 검사 결과',
    `상태: ${result.valid ? '통과' : '확인 필요'}`,
    `변수: ${result.entries.length}개`,
  ];

  if (result.issues.length > 0) {
    lines.push('', '문제 목록:');
    result.issues.forEach((issue) => {
      lines.push(`- ${issue.line}:${issue.column} ${issue.message}`);
    });
  }

  if (result.entries.length > 0) {
    lines.push('', '변수 목록:');
    result.entries.forEach((entry) => {
      lines.push(`- ${entry.key}: 문자열 ${entry.value.length}자 (값 숨김)`);
    });
  }

  return lines.join('\n');
}

export function getEnvIssueFeedback(issue: EnvValidationIssue): EnvIssueFeedback {
  return {
    title: getEnvIssueTitle(issue.code),
    message: issue.message,
    location: `${issue.line}행 ${issue.column}열`,
    suggestion: getEnvIssueSuggestion(issue),
  };
}

function parseEnvValue(source: string, lineNumber: number, valueColumn: number): {
  value: string;
  quote: EnvQuoteType;
  issues: EnvValidationIssue[];
} {
  const leadingWhitespaceLength = source.length - source.trimStart().length;
  const trimmedStart = source.trimStart();

  if (trimmedStart.startsWith('"')) {
    return parseQuotedValue(trimmedStart, lineNumber, valueColumn + leadingWhitespaceLength, 'double');
  }

  if (trimmedStart.startsWith("'")) {
    return parseQuotedValue(trimmedStart, lineNumber, valueColumn + leadingWhitespaceLength, 'single');
  }

  const valueWithoutComment = stripInlineComment(source).trim();
  const issues: EnvValidationIssue[] = [];
  const whitespaceIndex = valueWithoutComment.search(/\s/);

  if (whitespaceIndex !== -1) {
    issues.push(createIssue(
      'UNQUOTED_SPACE',
      lineNumber,
      valueColumn + leadingWhitespaceLength + whitespaceIndex,
      '공백이 포함된 문자열은 따옴표로 감싸주세요.',
    ));
  }

  return {
    value: valueWithoutComment,
    quote: 'none',
    issues,
  };
}

function parseQuotedValue(
  source: string,
  lineNumber: number,
  baseColumn: number,
  quote: Exclude<EnvQuoteType, 'none'>,
) {
  const quoteCharacter = quote === 'double' ? '"' : "'";
  let value = '';
  let cursor = 1;
  const issues: EnvValidationIssue[] = [];

  while (cursor < source.length) {
    const character = source[cursor];

    if (character === quoteCharacter) {
      const trailing = source.slice(cursor + 1);

      if (!isOnlyCommentOrWhitespace(trailing)) {
        issues.push(createIssue(
          'TRAILING_CHARACTERS',
          lineNumber,
          baseColumn + cursor + 1,
          '닫는 따옴표 뒤에는 주석만 올 수 있습니다.',
        ));
      }

      return {
        value,
        quote,
        issues,
      };
    }

    if (quote === 'double' && character === '\\') {
      const nextCharacter = source[cursor + 1];

      if (!nextCharacter || !supportedEscapes.has(nextCharacter)) {
        issues.push(createIssue(
          'INVALID_ESCAPE',
          lineNumber,
          baseColumn + cursor,
          '지원하지 않는 이스케이프 문자입니다. \\n, \\r, \\t, \\", \\\\, \\$만 사용할 수 있습니다.',
        ));
        return {
          value,
          quote,
          issues,
        };
      }

      value += supportedEscapes.get(nextCharacter);
      cursor += 2;
      continue;
    }

    value += character;
    cursor += 1;
  }

  issues.push(createIssue(
    'UNCLOSED_QUOTE',
    lineNumber,
    baseColumn,
    '따옴표가 닫히지 않았습니다. 문자열 끝에 닫는 따옴표를 추가해주세요.',
  ));

  return {
    value,
    quote,
    issues,
  };
}

function stripExportPrefix(line: string) {
  return line.replace(/^\s*export\s+/, '');
}

function stripInlineComment(value: string) {
  const commentIndex = value.search(/\s#/);

  if (commentIndex === -1) {
    return value;
  }

  return value.slice(0, commentIndex);
}

function isOnlyCommentOrWhitespace(value: string) {
  const trimmedValue = value.trim();
  return !trimmedValue || trimmedValue.startsWith('#');
}

function firstNonWhitespaceColumn(value: string) {
  const index = value.search(/\S/);
  return index === -1 ? 1 : index + 1;
}

function createIssue(
  code: EnvIssueCode,
  line: number,
  column: number,
  message: string,
  key?: string,
): EnvValidationIssue {
  return {
    code,
    line,
    column,
    message,
    key,
  };
}

function getEnvIssueTitle(code: EnvIssueCode) {
  switch (code) {
    case 'EMPTY_INPUT':
      return '검사할 내용 없음';
    case 'MISSING_EQUALS':
      return 'KEY=VALUE 형식 오류';
    case 'EMPTY_KEY':
      return '변수 이름 없음';
    case 'INVALID_KEY':
      return '사용할 수 없는 변수 이름';
    case 'DUPLICATE_KEY':
      return '중복된 변수 이름';
    case 'UNQUOTED_SPACE':
      return '따옴표가 필요한 문자열';
    case 'UNCLOSED_QUOTE':
      return '닫히지 않은 따옴표';
    case 'INVALID_ESCAPE':
      return '지원하지 않는 이스케이프 문자';
    case 'TRAILING_CHARACTERS':
      return '닫는 따옴표 뒤의 잘못된 문자';
  }
}

function getEnvIssueSuggestion(issue: EnvValidationIssue) {
  switch (issue.code) {
    case 'EMPTY_INPUT':
      return '검사할 .env 항목을 KEY=VALUE 형식으로 입력해주세요.';
    case 'MISSING_EQUALS':
      return '각 줄을 KEY=VALUE 형식으로 작성해주세요.';
    case 'EMPTY_KEY':
      return '등호 앞에 변수 이름을 입력해주세요.';
    case 'INVALID_KEY':
      return '변수 이름은 영문자 또는 밑줄로 시작하고 영문자, 숫자, 밑줄만 포함해야 합니다.';
    case 'DUPLICATE_KEY':
      return `${issue.key ?? '해당 변수'} 선언을 하나만 남기고 중복 줄을 제거해주세요.`;
    case 'UNQUOTED_SPACE':
      return issue.key
        ? `예: ${issue.key}="hello world"처럼 값을 큰따옴표 또는 작은따옴표로 감싸주세요.`
        : '공백이 있는 값은 큰따옴표 또는 작은따옴표로 감싸주세요.';
    case 'UNCLOSED_QUOTE':
      return '문자열 끝에 닫는 따옴표를 추가해주세요.';
    case 'INVALID_ESCAPE':
      return '허용된 이스케이프만 사용하거나 역슬래시를 제거해주세요.';
    case 'TRAILING_CHARACTERS':
      return '닫는 따옴표 뒤의 문자를 제거하거나 # 주석으로 분리해주세요.';
  }
}
