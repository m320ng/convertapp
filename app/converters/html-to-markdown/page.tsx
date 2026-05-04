'use client';

import { useCallback, useEffect, useState } from 'react';

import { convertHtmlToMarkdown } from '@/app/lib/html-to-markdown';

export default function HtmlToMarkdown() {
    const [markdown, setMarkdown] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [htmlInput, setHtmlInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const convertToMarkdown = useCallback((html: string) => {
        try {
            const nextMarkdown = convertHtmlToMarkdown(html);
            setMarkdown(nextMarkdown);
            setError(null);
            if (!showInput) {
                setHtmlInput('');
                setShowInput(false);
            }
        } catch (conversionError) {
            setMarkdown('');
            setError(
                conversionError instanceof Error
                    ? conversionError.message
                    : 'HTML을 Markdown으로 변환하는 중 오류가 발생했습니다.',
            );
        }
    }, [showInput]);

    const handlePaste = useCallback((e: ClipboardEvent) => {
        // textarea나 input에서의 붙여넣기는 무시
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
            return;
        }

        try {
            e.preventDefault();

            // 클립보드 데이터 가져오기
            const html = e.clipboardData?.getData('text/html') || e.clipboardData?.getData('text');

            if (!html) {
                throw new Error('클립보드가 비어있습니다');
            }

            convertToMarkdown(html);
        } catch (error) {
            setMarkdown('');
            setError(
                error instanceof Error
                    ? error.message
                    : '클립보드에서 HTML을 가져오지 못했습니다.',
            );
        }
    }, [convertToMarkdown]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (htmlInput.trim()) {
            convertToMarkdown(htmlInput);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(markdown);
            alert('클립보드에 복사되었습니다!');
        } catch {
            alert('클립보드에 복사하지 못했습니다');
        }
    };

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">HTML → Markdown 변환기</h1>
                <div className="mb-6">
                    <p className="mb-2 text-gray-600">
                        HTML이 포함된 내용을 복사한 후 이 페이지에서 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd> 를 눌러주세요.
                    </p>
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                        {showInput ? '직접 입력 숨기기' : '또는 직접 입력하기'}
                    </button>
                </div>

                {showInput && (
                    <form onSubmit={handleSubmit} className="mb-6">
                        <div className="space-y-2">
                            <textarea
                                value={htmlInput}
                                onChange={(e) => setHtmlInput(e.target.value)}
                                className="w-full h-48 p-4 border rounded-lg font-mono text-sm"
                                placeholder="HTML 코드를 여기에 입력하세요..."
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                                disabled={!htmlInput.trim()}
                            >
                                변환하기
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {markdown && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-semibold">변환 결과:</h2>
                            <button
                                onClick={copyToClipboard}
                                className="text-blue-500 hover:text-blue-600"
                            >
                                클립보드에 복사
                            </button>
                        </div>
                        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">
                            {markdown}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
