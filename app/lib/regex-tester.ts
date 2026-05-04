export interface RegexFlags {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  sticky: boolean;
}

export interface RegexTestInput {
  pattern: string;
  text: string;
  flags: RegexFlags;
}

export interface RegexMatch {
  value: string;
  index: number;
  endIndex: number;
  groups: string[];
}

export interface RegexTestResult {
  flags: string;
  hasMatch: boolean;
  matches: RegexMatch[];
}

export type RegexTestOutcome =
  | {
      ok: true;
      result: RegexTestResult;
    }
  | {
      ok: false;
      error: string;
    };

export const regexFlagOptions: RegexFlags = {
  global: false,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  sticky: false,
};

const orderedFlags: Array<[keyof RegexFlags, string]> = [
  ['global', 'g'],
  ['ignoreCase', 'i'],
  ['multiline', 'm'],
  ['dotAll', 's'],
  ['unicode', 'u'],
  ['sticky', 'y'],
];

export function getRegexFlagValue(flags: RegexFlags): string {
  validateRegexFlags(flags);

  return orderedFlags
    .filter(([flagName]) => flags[flagName])
    .map(([, flagValue]) => flagValue)
    .join('');
}

const missingPatternMessage = '정규식 패턴을 입력해주세요.';
const invalidFlagsMessage = '정규식 플래그 설정을 확인해주세요.';
const invalidPatternMessage =
  '정규식 패턴이 올바르지 않습니다. 괄호, 대괄호, 이스케이프 문자를 확인해주세요.';

function validateRegexFlags(flags: RegexFlags) {
  if (
    typeof flags !== 'object' ||
    flags === null ||
    orderedFlags.some(([flagName]) => typeof flags[flagName] !== 'boolean')
  ) {
    throw new Error(invalidFlagsMessage);
  }
}

export function testRegex(input: RegexTestInput): RegexTestResult {
  const pattern = input.pattern;

  if (!pattern.trim()) {
    throw new Error(missingPatternMessage);
  }

  const flags = getRegexFlagValue(input.flags);
  let regex: RegExp;

  try {
    regex = new RegExp(pattern, flags);
  } catch {
    throw new Error(invalidPatternMessage);
  }

  if (!input.text) {
    return {
      flags: regex.flags,
      hasMatch: false,
      matches: [],
    };
  }

  const matches: RegexMatch[] = [];

  if (regex.global) {
    for (const match of input.text.matchAll(regex)) {
      matches.push({
        value: match[0],
        index: match.index ?? 0,
        endIndex: (match.index ?? 0) + match[0].length,
        groups: match.slice(1),
      });

      if (match[0] === '') {
        regex.lastIndex += 1;
      }
    }
  } else {
    const match = regex.exec(input.text);

    if (match) {
      matches.push({
        value: match[0],
        index: match.index,
        endIndex: match.index + match[0].length,
        groups: match.slice(1),
      });
    }
  }

  return {
    flags: regex.flags,
    hasMatch: matches.length > 0,
    matches,
  };
}

export function safeTestRegex(input: RegexTestInput): RegexTestOutcome {
  try {
    return {
      ok: true,
      result: testRegex(input),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '정규식을 테스트하는 중 오류가 발생했습니다.',
    };
  }
}
