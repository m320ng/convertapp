'use client';

import { useState, useCallback, useEffect } from 'react';
import CryptoJS from 'crypto-js';

interface HashResult {
    algorithm: string;
    hash: string;
}

const ALGORITHMS = [
    { id: 'md5', name: 'MD5', fn: CryptoJS.MD5 },
    { id: 'sha1', name: 'SHA-1', fn: CryptoJS.SHA1 },
    { id: 'sha256', name: 'SHA-256', fn: CryptoJS.SHA256 },
    { id: 'sha512', name: 'SHA-512', fn: CryptoJS.SHA512 },
    { id: 'sha3', name: 'SHA-3', fn: CryptoJS.SHA3 },
    { id: 'ripemd160', name: 'RIPEMD160', fn: CryptoJS.RIPEMD160 }
];

export default function HashGenerator() {
    const [input, setInput] = useState('');
    const [results, setResults] = useState<HashResult[]>([]);
    const [showInput, setShowInput] = useState(false);
    const [selectedAlgorithms, setSelectedAlgorithms] = useState<Set<string>>(
        new Set(['md5', 'sha1', 'sha256'])
    );

    const generateHashes = (text: string) => {
        if (!text.trim()) {
            setResults([]);
            return;
        }

        const newResults = ALGORITHMS
            .filter(algo => selectedAlgorithms.has(algo.id))
            .map(algo => ({
                algorithm: algo.name,
                hash: algo.fn(text).toString()
            }));

        setResults(newResults);
    };

    const handlePaste = useCallback((e: ClipboardEvent) => {
        // textarea나 input에서의 붙여넣기는 무시
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
            return;
        }

        const text = e.clipboardData?.getData('text');
        if (text) {
            setInput(text);
            generateHashes(text);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        generateHashes(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            generateHashes(input);
        }
    };

    const copyToClipboard = async (hash: string) => {
        try {
            await navigator.clipboard.writeText(hash);
            alert('클립보드에 복사되었습니다!');
        } catch (error) {
            console.error('복사 실패:', error);
            alert('클립보드에 복사하지 못했습니다');
        }
    };

    const toggleAlgorithm = (algorithmId: string) => {
        const newSelected = new Set(selectedAlgorithms);
        if (newSelected.has(algorithmId)) {
            newSelected.delete(algorithmId);
        } else {
            newSelected.add(algorithmId);
        }
        setSelectedAlgorithms(newSelected);
        generateHashes(input);
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
                <h1 className="text-3xl font-bold mb-6">Hash 생성기</h1>

                <div className="mb-6">
                    <p className="mb-2 text-gray-600">
                        텍스트를 복사한 후 이 페이지에서 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd> 를 눌러주세요.
                    </p>
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                        {showInput ? '직접 입력 숨기기' : '또는 직접 입력하기'}
                    </button>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">해시 알고리즘 선택</h2>
                    <div className="flex flex-wrap gap-2">
                        {ALGORITHMS.map(algo => (
                            <button
                                key={algo.id}
                                onClick={() => toggleAlgorithm(algo.id)}
                                className={`px-3 py-1 rounded text-sm ${selectedAlgorithms.has(algo.id)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {algo.name}
                            </button>
                        ))}
                    </div>
                </div>

                {showInput && (
                    <form onSubmit={handleSubmit} className="mb-6">
                        <div className="space-y-2">
                            <textarea
                                value={input}
                                onChange={handleInputChange}
                                placeholder="해시값을 생성할 텍스트를 입력하세요..."
                                className="w-full h-48 p-4 border rounded-lg font-mono text-sm"
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                            >
                                해시 생성
                            </button>
                        </div>
                    </form>
                )}

                {input.trim() && (
                    <div className="mb-6">
                        <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">원문</h3>
                                <button
                                    onClick={() => copyToClipboard(input)}
                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                >
                                    복사
                                </button>
                            </div>
                            <pre className="bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                {input}
                            </pre>
                        </div>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">생성된 해시값</h2>
                        {results.map((result) => (
                            <div
                                key={result.algorithm}
                                className="border rounded-lg p-4 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{result.algorithm}</h3>
                                    <button
                                        onClick={() => copyToClipboard(result.hash)}
                                        className="text-blue-500 hover:text-blue-600 text-sm"
                                    >
                                        복사
                                    </button>
                                </div>
                                <pre className="bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                                    {result.hash}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">도움말</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>
                            지원하는 해시 알고리즘:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>MD5 (128비트)</li>
                                <li>SHA-1 (160비트)</li>
                                <li>SHA-256 (256비트)</li>
                                <li>SHA-512 (512비트)</li>
                                <li>SHA-3 (Keccak)</li>
                                <li>RIPEMD160 (160비트)</li>
                            </ul>
                        </li>
                        <li>
                            텍스트를 복사한 후 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd>를 누르거나, &quot;직접 입력하기&quot;를 클릭하여 입력할 수 있습니다.
                        </li>
                        <li>
                            여러 해시 알고리즘을 동시에 선택하여 비교할 수 있습니다.
                        </li>
                        <li>
                            &quot;복사&quot; 버튼을 클릭하여 원문이나 해시값을 클립보드에 복사할 수 있습니다.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 