'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

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
인라인 코드: \`console.log('Hello World')\`

코드 블록:
\`\`\`javascript
function hello() {
  console.log('Hello World');
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

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('클립보드에 복사되었습니다!');
        } catch (error) {
            console.error('복사 실패:', error);
            alert('클립보드에 복사하지 못했습니다.');
        }
    };

    return (
        <div className="min-h-screen p-8 bg-white">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Markdown 뷰어</h1>

                <div className="mb-6">
                    <div className="flex space-x-4 mb-4">
                        <button
                            onClick={() => setShowPreview(true)}
                            className={`px-4 py-2 rounded transition-colors ${showPreview
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                }`}
                        >
                            분할 화면
                        </button>
                        <button
                            onClick={() => setShowPreview(false)}
                            className={`px-4 py-2 rounded transition-colors ${!showPreview
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                }`}
                        >
                            전체 화면
                        </button>
                    </div>

                    <div className={`grid ${showPreview ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">
                                    마크다운 입력
                                </label>
                                <button
                                    onClick={() => copyToClipboard(markdown)}
                                    className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    복사
                                </button>
                            </div>
                            <textarea
                                value={markdown}
                                onChange={handleInputChange}
                                placeholder="마크다운 텍스트를 입력하세요"
                                className="w-full h-[calc(100vh-300px)] p-4 border rounded-lg font-mono text-sm resize-none bg-white border-gray-200 placeholder-gray-400"
                            />
                        </div>

                        {showPreview && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700">
                                        미리보기
                                    </label>
                                </div>
                                <div className="markdown-preview w-full h-[calc(100vh-300px)] p-6 border rounded-lg overflow-y-auto bg-white border-gray-200">
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
                                                        src={src || ''}
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
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">도움말</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>마크다운 문법으로 작성된 텍스트를 실시간으로 미리볼 수 있습니다.</li>
                        <li>GitHub Flavored Markdown(GFM)을 지원하여 표, 체크리스트 등의 확장 문법을 사용할 수 있습니다.</li>
                        <li>분할 화면 모드에서는 입력과 미리보기를 동시에 볼 수 있습니다.</li>
                        <li>전체 화면 모드에서는 입력 영역을 더 넓게 사용할 수 있습니다.</li>
                        <li>작성한 마크다운 텍스트를 클립보드에 복사할 수 있습니다.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 