export interface Tool {
  id: string;
  title: string;
  description: string;
  path: string;
  category: ToolCategory;
  group: string;
  shortcut: string;
  accent: string;
}

export type ToolCategory = 'common' | 'code-docs' | 'security-network' | 'media';

export const tools: Tool[] = [
  {
    id: 'json-formatter',
    title: 'JSON 포맷터',
    description: 'JSON 데이터 정리, 압축, 유효성 검사',
    path: '/converters/json-formatter',
    category: 'common',
    group: '데이터',
    shortcut: 'JSON',
    accent: 'bg-emerald-500',
  },
  {
    id: 'base64-converter',
    title: 'Base64 인코더/디코더',
    description: '텍스트와 Base64 값을 빠르게 상호 변환',
    path: '/converters/base64-converter',
    category: 'common',
    group: '인코딩',
    shortcut: 'B64',
    accent: 'bg-sky-500',
  },
  {
    id: 'jwt-decoder',
    title: 'JWT 디코더/생성기',
    description: 'JWT 디코딩과 HS/RS 알고리즘 서명 토큰 생성',
    path: '/converters/jwt-decoder',
    category: 'security-network',
    group: '보안',
    shortcut: 'JWT',
    accent: 'bg-purple-600',
  },
  {
    id: 'js-beautifier',
    title: 'JavaScript 코드 정리',
    description: '압축되거나 흐트러진 JavaScript 코드 포맷팅',
    path: '/converters/js-beautifier',
    category: 'code-docs',
    group: '코드',
    shortcut: 'JS',
    accent: 'bg-amber-500',
  },
  {
    id: 'curl-to-code',
    title: 'Curl → Code 생성기',
    description: 'curl 명령어를 JavaScript, Node.js, Python, PHP 코드로 변환',
    path: '/converters/curl-to-code',
    category: 'code-docs',
    group: '코드',
    shortcut: 'cURL',
    accent: 'bg-teal-600',
  },
  {
    id: 'code-to-curl',
    title: 'Code → Curl 생성기',
    description: 'fetch, Python requests, Raw HTTP 스니펫을 curl 명령어로 변환',
    path: '/converters/code-to-curl',
    category: 'code-docs',
    group: '코드',
    shortcut: 'CURL',
    accent: 'bg-emerald-600',
  },
  {
    id: 'timestamp-converter',
    title: 'Unix Timestamp ↔ 날짜',
    description: 'Unix timestamp와 일반 날짜 형식 변환',
    path: '/converters/timestamp-converter',
    category: 'common',
    group: '시간',
    shortcut: 'UTC',
    accent: 'bg-indigo-500',
  },
  {
    id: 'regex-tester',
    title: 'Regex 테스트',
    description: '정규식 패턴, 테스트 텍스트, 플래그를 브라우저에서 바로 검증',
    path: '/converters/regex-tester',
    category: 'code-docs',
    group: '코드',
    shortcut: 'RX',
    accent: 'bg-blue-600',
  },
  {
    id: 'env-validator',
    title: '.env 검사기',
    description: '.env 변수 구문, 문자열 따옴표, 중복 키, 이스케이프 오류 검증',
    path: '/converters/env-validator',
    category: 'code-docs',
    group: '코드',
    shortcut: 'ENV',
    accent: 'bg-zinc-700',
  },
  {
    id: 'random-token-generator',
    title: 'Random Token 생성기',
    description: '길이, 문자 집합, 제외 문자, 생성 개수를 지정해 토큰 생성',
    path: '/converters/random-token-generator',
    category: 'security-network',
    group: '보안',
    shortcut: 'TOK',
    accent: 'bg-blue-600',
  },
  {
    id: 'hash-generator',
    title: 'Hash 생성기',
    description: 'MD5, SHA-1, SHA-256 등 해시값 생성',
    path: '/converters/hash-generator',
    category: 'security-network',
    group: '보안',
    shortcut: 'SHA',
    accent: 'bg-rose-500',
  },
  {
    id: 'sql-formatter',
    title: 'SQL 쿼리 포맷터',
    description: 'SQL 쿼리 구문을 읽기 쉬운 구조로 정리',
    path: '/converters/sql-formatter',
    category: 'common',
    group: '데이터',
    shortcut: 'SQL',
    accent: 'bg-cyan-500',
  },
  {
    id: 'html-to-markdown',
    title: 'HTML → Markdown 변환기',
    description: 'HTML 문서를 Markdown 형식으로 변환',
    path: '/converters/html-to-markdown',
    category: 'code-docs',
    group: '문서',
    shortcut: 'MD',
    accent: 'bg-violet-500',
  },
  {
    id: 'markdown-viewer',
    title: 'Markdown 뷰어',
    description: '마크다운 문서 실시간 미리보기',
    path: '/converters/markdown-viewer',
    category: 'code-docs',
    group: '문서',
    shortcut: 'VIEW',
    accent: 'bg-lime-600',
  },
  {
    id: 'svg-to-react',
    title: 'SVG → React 변환기',
    description: 'SVG 마크업을 React 컴포넌트로 변환',
    path: '/converters/svg-to-react',
    category: 'code-docs',
    group: '코드',
    shortcut: 'SVG',
    accent: 'bg-fuchsia-500',
  },
  {
    id: 'image-to-base64',
    title: '이미지 → Base64 변환기',
    description: '이미지를 Base64 문자열로 변환',
    path: '/converters/image-to-base64',
    category: 'media',
    group: '이미지',
    shortcut: 'IMG',
    accent: 'bg-orange-500',
  },
  {
    id: 'base64-to-image',
    title: 'Base64 → 이미지 변환기',
    description: 'Base64 문자열을 이미지로 변환',
    path: '/converters/base64-to-image',
    category: 'media',
    group: '이미지',
    shortcut: 'PIC',
    accent: 'bg-teal-500',
  },
  {
    id: 'ip-geolocation',
    title: 'IP → 위치정보 변환기',
    description: 'IP 주소의 국가, 도시, 좌표 정보 조회',
    path: '/converters/ip-geolocation',
    category: 'security-network',
    group: '네트워크',
    shortcut: 'IP',
    accent: 'bg-slate-600',
  },
];

export const toolGroups = [
  {
    id: 'common',
    title: '자주 쓰는 변환',
    description: '데이터 정리, 텍스트 인코딩, 시간 변환처럼 반복 빈도가 높은 작업',
  },
  {
    id: 'code-docs',
    title: '코드와 문서',
    description: '소스 코드 포맷팅, Markdown 문서, React 컴포넌트 변환 작업',
  },
  {
    id: 'security-network',
    title: '보안과 네트워크',
    description: '해시 생성과 IP 기반 조회처럼 검증과 확인에 쓰는 도구',
  },
  {
    id: 'media',
    title: '이미지 변환',
    description: '이미지 파일과 Base64 문자열을 오가는 미디어 변환 도구',
  },
] satisfies Array<{
  id: ToolCategory;
  title: string;
  description: string;
}>;

export function getToolByPath(pathname: string) {
  return tools.find((tool) => tool.path === pathname) ?? null;
}

export function getAdjacentTools(toolId: string) {
  const activeIndex = tools.findIndex((tool) => tool.id === toolId);

  if (activeIndex === -1) {
    return {
      previous: null,
      next: null,
    };
  }

  return {
    previous: tools[(activeIndex - 1 + tools.length) % tools.length],
    next: tools[(activeIndex + 1) % tools.length],
  };
}
