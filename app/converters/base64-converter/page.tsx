'use client';

import { useState } from 'react';

type ConversionMode = 'encode' | 'decode';

export default function Base64Converter() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState<ConversionMode>('encode');
    const [error, setError] = useState<string | null>(null);

    const handleConversion = (value: string) => {
        try {
            setError(null);
            if (!value.trim()) {
                setOutput('');
                return;
            }

            if (mode === 'encode') {
                // UTF-8 텍스트를 Base64로 인코딩
                const encoded = btoa(unescape(encodeURIComponent(value)));
                setOutput(encoded);
            } else {
                // Base64를 UTF-8 텍스트로 디코딩
                const decoded = decodeURIComponent(escape(atob(value)));
                setOutput(decoded);
            }
        } catch (err) {
            console.error('변환 중 오류:', err);
            setError(mode === 'encode'
                ? '텍스트를 Base64로 인코딩하는 중 오류가 발생했습니다.'
                : 'Base64를 디코딩하는 중 오류가 발생했습니다. 올바른 Base64 형식인지 확인해주세요.');
            setOutput('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        // 입력값이 변경될 때마다 자동으로 변환
        if (value.trim()) {
            handleConversion(value);
        } else {
            setOutput('');
            setError(null);
        }
    };

    const handleModeChange = (newMode: ConversionMode) => {
        setMode(newMode);
        // 모드가 변경될 때 입력값이 있다면 자동으로 변환
        if (input.trim()) {
            const temp = input;
            setInput(output);
            setOutput(temp);
            setError(null);
        }
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
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Base64 인코더/디코더</h1>

                <div className="mb-6">
                    <div className="flex space-x-4 mb-4">
                        <button
                            onClick={() => handleModeChange('encode')}
                            className={`px-4 py-2 rounded ${mode === 'encode'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            텍스트 → Base64
                        </button>
                        <button
                            onClick={() => handleModeChange('decode')}
                            className={`px-4 py-2 rounded ${mode === 'decode'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            Base64 → 텍스트
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">
                                    {mode === 'encode' ? '텍스트 입력' : 'Base64 입력'}
                                </label>
                                <button
                                    onClick={() => copyToClipboard(input)}
                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                >
                                    복사
                                </button>
                            </div>
                            <textarea
                                value={input}
                                onChange={handleInputChange}
                                placeholder={mode === 'encode'
                                    ? '변환할 텍스트를 입력하세요'
                                    : 'Base64 형식의 문자열을 입력하세요'}
                                className="w-full h-64 p-3 border rounded-lg font-mono text-sm resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">
                                    {mode === 'encode' ? 'Base64 결과' : '텍스트 결과'}
                                </label>
                                <button
                                    onClick={() => copyToClipboard(output)}
                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                >
                                    복사
                                </button>
                            </div>
                            <textarea
                                value={output}
                                readOnly
                                className="w-full h-64 p-3 border rounded-lg font-mono text-sm bg-gray-50 resize-none"
                                placeholder="변환 결과가 여기에 표시됩니다"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                            {error}
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">도움말</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>
                            텍스트를 Base64로 인코딩하거나, Base64를 텍스트로 디코딩할 수 있습니다.
                        </li>
                        <li>
                            입력값을 변경하면 자동으로 변환이 이루어집니다.
                        </li>
                        <li>
                            모드를 변경하면 이전 결과값이 새로운 입력값으로 자동 설정됩니다.
                        </li>
                        <li>
                            유니코드 문자(한글, 이모지 등)를 포함한 모든 텍스트를 지원합니다.
                        </li>
                        <li>
                            각 입력창과 결과창의 내용을 클립보드에 복사할 수 있습니다.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 