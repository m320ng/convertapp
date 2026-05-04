'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

import { CopyResultAction } from '@/app/components/copy-result-action';

const DEFAULT_MARKDOWN = `# 마크다운 미리보기

## 기본 문법

### 텍스트 스타일
일반 텍스트
**굵은 텍스트**
*기울임 텍스트*
~~취소선~~

### 목록
- 순서 없는 목록 1
- 순서 없는 목록 2
  - 중첩된 목록
  - 중첩된 목록 2

1. 순서 있는 목록 1
2. 순서 있는 목록 2

### 인용
> 인용문을 작성할 수 있습니다.
> 여러 줄도 가능합니다.

### 코드
인라인 코드: \`const greeting = 'Hello World'\`

코드 블록:
\`\`\`javascript
function hello() {
  return 'Hello World';
}
\`\`\`

### 표
| 제목 1 | 제목 2 |
|--------|--------|
| 내용 1 | 내용 2 |
| 내용 3 | 내용 4 |

### 링크와 이미지
[Google](https://google.com)
![이미지 설명](http://placeholder.heyo.me/150)

### 체크리스트
- [x] 완료된 항목
- [ ] 미완료 항목

### 수평선
---
`;

// Update component types
interface CodeProps {
    inline?: boolean;
    children?: React.ReactNode;
    className?: string;
}

export default function MarkdownViewer() {
    const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
    const [showPreview, setShowPreview] = useState(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMarkdown(e.target.value);
    };

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-7">
                    <p className="text-sm font-bold text-lime-700">브라우저 로컬 문서 미리보기</p>
                    <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                                Markdown 뷰어
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                GitHub Flavored Markdown을 입력하고 표, 체크리스트, 코드 블록을 실시간으로 확인합니다.
                            </p>
                        </div>
                        <div className="w-fit max-w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                            {showPreview ? '분할 화면' : '입력 전체 화면'}
                        </div>
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPreview(true)}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${showPreview
                                ? 'bg-slate-950 text-white'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            분할 화면
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPreview(false)}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${!showPreview
                                ? 'bg-slate-950 text-white'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            전체 화면
                        </button>
                    </div>

                    <div className={`grid min-w-0 ${showPreview ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">
                                    마크다운 입력
                                </label>
                                <CopyResultAction
                                    value={markdown}
                                    label="복사"
                                    copiedMessage="마크다운을 클립보드에 복사했습니다."
                                    emptyMessage="복사할 마크다운이 없습니다."
                                    disabled={!markdown}
                                    className="rounded-md border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                                />
                            </div>
                            <textarea
                                value={markdown}
                                onChange={handleInputChange}
                                placeholder="마크다운 텍스트를 입력하세요"
                                className="w-full h-[calc(100vh-300px)] p-4 border rounded-lg font-mono text-sm resize-none bg-white border-gray-200 placeholder-gray-400"
                            />
                        </div>

                        {showPreview && (
                            <div className="min-w-0 space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700">
                                        미리보기
                                    </label>
                                </div>
                                <div className="markdown-preview result-output h-[calc(100vh-300px)] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-6">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ children }) => (
                                                <h1 className="text-3xl font-bold mb-6">{children}</h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="text-2xl font-bold mt-8 mb-4 pb-2 border-b">{children}</h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="text-xl font-bold mt-6 mb-4">{children}</h3>
                                            ),
                                            h4: ({ children }) => (
                                                <h4 className="text-lg font-bold mt-4 mb-2">{children}</h4>
                                            ),
                                            p: ({ children }) => (
                                                <p className="my-4 leading-7">{children}</p>
                                            ),
                                            a: ({ children, href }) => (
                                                <a
                                                    className="text-blue-500 hover:text-blue-600 transition-colors"
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {children}
                                                </a>
                                            ),
                                            blockquote: ({ children }) => (
                                                <blockquote
                                                    className="pl-4 border-l-4 border-blue-500 my-4 italic text-gray-700"
                                                >
                                                    {children}
                                                </blockquote>
                                            ),
                                            code: ({ inline, children }: CodeProps) => (
                                                inline ?
                                                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-pink-500 text-sm">
                                                        {children}
                                                    </code> :
                                                    <code className="block bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                                        {children}
                                                    </code>
                                            ),
                                            ul: ({ children }) => (
                                                <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>
                                            ),
                                            ol: ({ children }) => (
                                                <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>
                                            ),
                                            li: ({ children }) => (
                                                <li className="my-1">{children}</li>
                                            ),
                                            img: ({ src, alt }) => (
                                                <div className="relative w-full h-64 my-4">
                                                    <Image
                                                        src={typeof src === 'string' ? src : ''}
                                                        alt={alt || '마크다운 이미지'}
                                                        fill
                                                        className="object-contain rounded-lg"
                                                    />
                                                </div>
                                            ),
                                            table: ({ children }) => (
                                                <div className="my-4 overflow-x-auto">
                                                    <table className="min-w-full border border-gray-200 rounded-lg">
                                                        {children}
                                                    </table>
                                                </div>
                                            ),
                                            th: ({ children }) => (
                                                <th className="bg-gray-50 px-6 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                                                    {children}
                                                </th>
                                            ),
                                            td: ({ children }) => (
                                                <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">
                                                    {children}
                                                </td>
                                            ),
                                            hr: () => (
                                                <hr className="my-8 border-t border-gray-200" />
                                            ),
                                        }}
                                    >
                                        {markdown}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">도움말</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>마크다운 문법으로 작성된 텍스트를 실시간으로 미리볼 수 있습니다.</li>
                        <li>GitHub Flavored Markdown(GFM)을 지원하여 표, 체크리스트 등의 확장 문법을 사용할 수 있습니다.</li>
                        <li>분할 화면 모드에서는 입력과 미리보기를 동시에 볼 수 있습니다.</li>
                        <li>전체 화면 모드에서는 입력 영역을 더 넓게 사용할 수 있습니다.</li>
                        <li>작성한 마크다운 텍스트를 클립보드에 복사할 수 있습니다.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
