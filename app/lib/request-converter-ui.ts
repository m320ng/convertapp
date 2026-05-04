import {
  getCodeToCurlInputLanguages,
  type CodeToCurlInputLanguage,
} from './code-to-curl.ts';
import {
  getCurlToCodeLanguages,
  type CurlToCodeLanguage,
} from './curl-to-code.ts';

export type RequestConverterDirection = 'curl-to-code' | 'code-to-curl';
export type RequestConverterLanguage = CurlToCodeLanguage | CodeToCurlInputLanguage;

export interface RequestConverterDirectionOption {
  id: RequestConverterDirection;
  label: string;
  description: string;
  inputLabel: string;
  outputLabel: string;
}

const DIRECTIONS: RequestConverterDirectionOption[] = [
  {
    id: 'curl-to-code',
    label: 'Curl → Code',
    description: 'curl 명령어를 실행 가능한 요청 코드로 생성',
    inputLabel: 'curl 명령어',
    outputLabel: '생성 코드',
  },
  {
    id: 'code-to-curl',
    label: 'Code → Curl',
    description: '요청 코드나 Raw HTTP를 재현 가능한 curl 명령어로 변환',
    inputLabel: '요청 코드',
    outputLabel: 'curl 명령어',
  },
];

export function getRequestConverterDirections() {
  return DIRECTIONS;
}

export function getDefaultLanguageForDirection(direction: 'curl-to-code'): CurlToCodeLanguage;
export function getDefaultLanguageForDirection(direction: 'code-to-curl'): CodeToCurlInputLanguage;
export function getDefaultLanguageForDirection(
  direction: RequestConverterDirection,
): RequestConverterLanguage {
  if (direction === 'code-to-curl') {
    return 'javascript-fetch' satisfies CodeToCurlInputLanguage;
  }

  return 'javascript-fetch' satisfies CurlToCodeLanguage;
}

export function getRequestConverterLanguageOptions(direction: RequestConverterDirection) {
  if (direction === 'code-to-curl') {
    return getCodeToCurlInputLanguages();
  }

  return getCurlToCodeLanguages();
}
