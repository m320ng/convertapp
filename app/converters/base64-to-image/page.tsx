'use client';

import { useState, useCallback, useEffect } from 'react';

interface ImageInfo {
    base64: string;
    type: string;
    size: number;
}

export default function Base64ToImage() {
    const [input, setInput] = useState('');
    const [image, setImage] = useState<ImageInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showInput, setShowInput] = useState(false);

    const extractBase64FromInput = (input: string): string => {
        // <img> 태그에서 src 속성 추출
        const srcMatch = input.match(/src=["'](data:image\/[^"']+)["']/);
        if (srcMatch) {
            return srcMatch[1];
        }

        // data:image 형식 찾기
        const dataMatch = input.match(/(data:image\/[^;]+;base64,[^"'\s]+)/);
        if (dataMatch) {
            return dataMatch[1];
        }

        // base64 문자열만 있는 경우
        const base64Match = input.match(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
        if (base64Match) {
            return `data:image/png;base64,${input}`;
        }

        throw new Error('유효한 Base64 이미지를 찾을 수 없습니다.');
    };

    const convertToImage = (input: string) => {
        try {
            setError(null);
            const base64 = extractBase64FromInput(input.trim());

            // 이미지 타입 추출
            const typeMatch = base64.match(/^data:([^;]+);/);
            const type = typeMatch ? typeMatch[1] : 'image/png';

            // Base64 크기 계산 (대략적인 크기)
            const base64Length = base64.substring(base64.indexOf(',') + 1).length;
            const sizeInBytes = Math.floor((base64Length * 3) / 4);

            setImage({
                base64,
                type,
                size: sizeInBytes
            });
        } catch (err) {
            console.error('변환 중 오류:', err);
            setError(err instanceof Error ? err.message : '변환 중 오류가 발생했습니다.');
            setImage(null);
        }
    };

    const handlePaste = useCallback((e: ClipboardEvent) => {
        // textarea나 input에서의 붙여넣기는 무시
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
            return;
        }

        const text = e.clipboardData?.getData('text');
        if (text) {
            setInput(text);
            convertToImage(text);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        if (!value.trim()) {
            setImage(null);
            setError(null);
            return;
        }
        convertToImage(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            convertToImage(input);
        }
    };

    const downloadImage = () => {
        if (!image) return;

        const link = document.createElement('a');
        link.href = image.base64;
        link.download = `image.${image.type.split('/')[1] || 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                <h1 className="text-3xl font-bold mb-6">Base64 → 이미지 변환기</h1>

                <div className="mb-6">
                    <p className="mb-2 text-gray-600">
                        Base64 문자열을 복사한 후 이 페이지에서 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd> 를 눌러주세요.
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
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Base64 문자열을 입력하거나 <img> 태그를 붙여넣으세요..."
                                className="w-full h-48 p-4 border rounded-lg font-mono text-sm"
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                            >
                                변환하기
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {image && (
                    <div className="mt-6 border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">변환된 이미지</h3>
                                <p className="text-sm text-gray-500">
                                    {image.type} • {formatFileSize(image.size)}
                                </p>
                            </div>
                            <button
                                onClick={downloadImage}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                다운로드
                            </button>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <img
                                src={image.base64}
                                alt="변환된 이미지"
                                className="max-w-full max-h-96 mx-auto"
                            />
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">도움말</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>
                            다음과 같은 형식을 지원합니다:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>
                                    <code>data:image/[형식];base64,...</code>
                                </li>
                                <li>
                                    <code>&lt;img src=&quot;data:image/[형식];base64,...&quot;&gt;</code>
                                </li>
                                <li>
                                    Base64 문자열만 입력 (자동으로 PNG로 처리)
                                </li>
                            </ul>
                        </li>
                        <li>
                            Base64 문자열을 복사한 후 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd>를 누르거나, &quot;직접 입력하기&quot;를 클릭하여 입력할 수 있습니다.
                        </li>
                        <li>
                            변환된 이미지는 &quot;다운로드&quot; 버튼을 클릭하여 저장할 수 있습니다.
                        </li>
                        <li>
                            이미지 미리보기가 자동으로 표시됩니다.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 