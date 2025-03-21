'use client';

import { useState, useEffect } from 'react';

export default function JsBeautifier() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [directInput, setDirectInput] = useState('');

    const handlePaste = async (e: ClipboardEvent) => {
        // textarea나 input에서의 붙여넣기는 무시
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
            return;
        }

        try {
            const text = e.clipboardData?.getData('text');
            if (text) {
                setInput(text);
                await beautifyCode(text);
            }
        } catch (error) {
            console.error('붙여넣기 실패:', error);
            alert('클립보드에서 가져오지 못했습니다');
        }
    };

    const beautifyCode = async (code: string) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/convert/js-beautify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                throw new Error('코드 정리에 실패했습니다');
            }

            const data = await response.json();
            setOutput(data.beautified);
            if (!showInput) {  // 직접 입력 모드가 아닐 때만 초기화
                setDirectInput('');
                setShowInput(false);
            }
        } catch (error) {
            console.error('JavaScript 코드 정리 중 오류 발생:', error);
            alert('코드 정리에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (directInput.trim()) {
            setInput(directInput);
            await beautifyCode(directInput);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(output);
            alert('클립보드에 복사되었습니다!');
        } catch (error) {
            console.error('복사 실패:', error);
            alert('클립보드에 복사하지 못했습니다');
        }
    };

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">JavaScript 코드 정리</h1>
                <div className="mb-6">
                    <p className="mb-2 text-gray-600">
                        JavaScript 코드를 복사한 후 이 페이지에서 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd> 를 눌러주세요.
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
                                value={directInput}
                                onChange={(e) => setDirectInput(e.target.value)}
                                className="w-full h-48 p-4 border rounded-lg font-mono text-sm"
                                placeholder="JavaScript 코드를 여기에 입력하세요..."
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                                disabled={!directInput.trim() || isLoading}
                            >
                                {isLoading ? '정리 중...' : '코드 정리하기'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {input && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">입력된 코드:</h2>
                            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono">
                                {input}
                            </pre>
                        </div>
                    )}

                    {isLoading && (
                        <div className="text-center text-gray-600">
                            코드를 정리하는 중...
                        </div>
                    )}

                    {output && !isLoading && (
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-semibold">정리된 코드:</h2>
                                <button
                                    onClick={copyToClipboard}
                                    className="text-blue-500 hover:text-blue-600"
                                >
                                    클립보드에 복사
                                </button>
                            </div>
                            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono">
                                {output}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 