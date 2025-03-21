'use client';

import { useState, useEffect } from 'react';

export default function JsonFormatter() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);
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
                formatJson(text);
            }
        } catch (error) {
            console.error('붙여넣기 실패:', error);
            alert('클립보드에서 가져오지 못했습니다');
        }
    };

    const formatJson = (jsonString: string) => {
        try {
            // JSON 파싱하여 유효성 검사
            const parsed = JSON.parse(jsonString);
            // 2칸 들여쓰기로 포맷팅
            const formatted = JSON.stringify(parsed, null, 2);
            setOutput(formatted);
            setError(null);
        } catch (err) {
            setError('유효하지 않은 JSON 형식입니다. 다시 확인해주세요.');
            setOutput('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (directInput.trim()) {
            setInput(directInput);
            formatJson(directInput);
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

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(output || input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
        } catch (err) {
            setError('JSON을 압축하는 중 오류가 발생했습니다.');
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
                <h1 className="text-3xl font-bold mb-6">JSON 포맷터</h1>
                <div className="mb-6">
                    <p className="mb-2 text-gray-600">
                        JSON 데이터를 복사한 후 이 페이지에서 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd> 를 눌러주세요.
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
                                placeholder="JSON 데이터를 여기에 입력하세요..."
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                                disabled={!directInput.trim()}
                            >
                                포맷팅하기
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {input && !error && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">입력된 데이터:</h2>
                            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-auto max-h-48">
                                {input}
                            </pre>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-semibold">포맷팅된 JSON:</h2>
                                <div className="space-x-4">
                                    <button
                                        onClick={minifyJson}
                                        className="text-blue-500 hover:text-blue-600 text-sm"
                                    >
                                        압축하기
                                    </button>
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-blue-500 hover:text-blue-600 text-sm"
                                    >
                                        클립보드에 복사
                                    </button>
                                </div>
                            </div>
                            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
                                {output}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 