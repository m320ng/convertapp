'use client';

import { useState, useEffect } from 'react';
import { format } from 'sql-formatter';

export default function SqlFormatter() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [directInput, setDirectInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePaste = async (e: ClipboardEvent) => {
        // textarea나 input에서의 붙여넣기는 무시
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
            return;
        }

        try {
            const text = e.clipboardData?.getData('text');
            if (text) {
                setInput(text);
                formatSql(text);
            }
        } catch (error) {
            console.error('붙여넣기 실패:', error);
            alert('클립보드에서 가져오지 못했습니다');
        }
    };

    const formatSql = (sql: string) => {
        try {
            setIsLoading(true);
            const formatted = format(sql, {
                language: 'sql',
                tabWidth: 4,
                keywordCase: 'upper',
                linesBetweenQueries: 2,
            });
            setOutput(formatted);
        } catch (error) {
            console.error('SQL 포맷팅 중 오류 발생:', error);
            alert('SQL 쿼리 포맷팅에 실패했습니다. 쿼리문을 확인해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (directInput.trim()) {
            setInput(directInput);
            formatSql(directInput);
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
                <h1 className="text-3xl font-bold mb-6">SQL 쿼리 포맷터</h1>
                <div className="mb-6">
                    <p className="mb-2 text-gray-600">
                        SQL 쿼리를 복사한 후 이 페이지에서 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd> 를 눌러주세요.
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
                                placeholder="SQL 쿼리를 여기에 입력하세요..."
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                                disabled={!directInput.trim() || isLoading}
                            >
                                {isLoading ? '포맷팅 중...' : '포맷팅하기'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {input && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">입력된 쿼리:</h2>
                            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-auto max-h-48">
                                {input}
                            </pre>
                        </div>
                    )}

                    {isLoading && (
                        <div className="text-center text-gray-600">
                            SQL 쿼리를 포맷팅하는 중...
                        </div>
                    )}

                    {output && !isLoading && (
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-semibold">포맷팅된 쿼리:</h2>
                                <button
                                    onClick={copyToClipboard}
                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                >
                                    클립보드에 복사
                                </button>
                            </div>
                            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
                                {output}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 