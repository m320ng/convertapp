'use client';

import Link from 'next/link';

interface Converter {
  id: string;
  title: string;
  description: string;
  path: string;
}

const converters: Converter[] = [
  {
    id: 'html-to-markdown',
    title: 'HTML → Markdown 변환기',
    description: 'HTML을 Markdown으로 변환',
    path: '/converters/html-to-markdown',
  },
  {
    id: 'js-beautifier',
    title: 'JavaScript 코드 정리',
    description: 'JavaScript 코드 포맷팅 도구',
    path: '/converters/js-beautifier',
  },
  {
    id: 'json-formatter',
    title: 'JSON 포맷터',
    description: 'JSON 데이터 정리 및 유효성 검사',
    path: '/converters/json-formatter',
  },
  {
    id: 'sql-formatter',
    title: 'SQL 쿼리 포맷터',
    description: 'SQL 쿼리 구문 정리',
    path: '/converters/sql-formatter',
  },
  {
    id: 'svg-to-react',
    title: 'SVG → React 변환기',
    description: 'SVG를 React 컴포넌트로 변환',
    path: '/converters/svg-to-react',
  },
  {
    id: 'timestamp-converter',
    title: 'Unix Timestamp ↔ 날짜',
    description: 'Unix timestamp와 일반 날짜 상호 변환',
    path: '/converters/timestamp-converter',
  },
  {
    id: 'image-to-base64',
    title: '이미지 → Base64 변환기',
    description: '이미지를 Base64 문자열로 변환',
    path: '/converters/image-to-base64',
  },
  {
    id: 'base64-to-image',
    title: 'Base64 → 이미지 변환기',
    description: 'Base64 문자열을 이미지로 변환',
    path: '/converters/base64-to-image',
  },
  {
    id: 'base64-converter',
    title: 'Base64 인코더/디코더',
    description: '텍스트와 Base64 상호 변환',
    path: '/converters/base64-converter',
  },
  {
    id: 'hash-generator',
    title: 'Hash 생성기',
    description: 'MD5, SHA-1, SHA-256 등 해시값 생성',
    path: '/converters/hash-generator',
  },
  {
    id: 'ip-geolocation',
    title: 'IP → 위치정보 변환기',
    description: 'IP 주소의 국가, 도시, 좌표 정보 조회',
    path: '/converters/ip-geolocation',
  },
  {
    id: 'markdown-viewer',
    title: 'Markdown 뷰어',
    description: '마크다운 실시간 미리보기 도구',
    path: '/converters/markdown-viewer',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            개발자 변환 도구
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            개발 작업에 필요한 다양한 변환 도구 모음
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {converters.map((converter) => (
            <Link
              key={converter.id}
              href={converter.path}
              className="group block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {converter.title}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {converter.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>더 많은 개발 도구 추가 예정</p>
        </footer>
      </div>
    </main>
  );
}
