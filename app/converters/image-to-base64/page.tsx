'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileInfo {
    name: string;
    size: number;
    type: string;
    base64: string;
}

export default function ImageToBase64() {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        setError(null);
        const newFiles: FileInfo[] = [];

        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (!file) continue;

                try {
                    const base64 = await convertToBase64(file);
                    newFiles.push({
                        name: `붙여넣은 이미지 ${new Date().toLocaleTimeString()}`,
                        size: file.size,
                        type: file.type,
                        base64: base64,
                    });
                } catch (err) {
                    console.error('파일 변환 중 오류:', err);
                    setError('파일을 변환하는 중 오류가 발생했습니다.');
                }
            }
        }

        if (newFiles.length === 0) {
            setError('클립보드에서 이미지를 찾을 수 없습니다.');
            return;
        }

        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError(null);
        const newFiles: FileInfo[] = [];

        for (const file of acceptedFiles) {
            if (!file.type.startsWith('image/')) {
                setError('이미지 파일만 지원됩니다.');
                continue;
            }

            try {
                const base64 = await convertToBase64(file);
                newFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    base64: base64,
                });
            } catch (err) {
                console.error('파일 변환 중 오류:', err);
                setError('파일을 변환하는 중 오류가 발생했습니다.');
            }
        }

        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
        }
    });

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const copyToClipboard = async (base64: string) => {
        try {
            await navigator.clipboard.writeText(base64);
            alert('클립보드에 복사되었습니다!');
        } catch (error) {
            console.error('복사 실패:', error);
            alert('클립보드에 복사하지 못했습니다');
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">이미지 → Base64 변환기</h1>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
                >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="text-lg">
                            {isDragActive ? (
                                <p className="text-blue-500">이미지를 여기에 놓으세요...</p>
                            ) : (
                                <p>
                                    이미지를 드래그하여 놓거나 <span className="text-blue-500">클릭</span>하여 선택하세요
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">
                            PNG, JPG, GIF, BMP, WEBP 파일 지원
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            또는 <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd>로 클립보드의 이미지를 붙여넣을 수 있습니다
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {files.length > 0 && (
                    <div className="mt-8 space-y-6">
                        <h2 className="text-xl font-semibold">변환된 파일</h2>
                        {files.map((file, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{file.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {file.type} • {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <div className="space-x-2">
                                        <button
                                            onClick={() => copyToClipboard(file.base64)}
                                            className="px-3 py-1 text-sm text-blue-500 hover:text-blue-600"
                                        >
                                            복사
                                        </button>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="px-3 py-1 text-sm text-red-500 hover:text-red-600"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-20 h-20 flex-shrink-0">
                                            <img
                                                src={file.base64}
                                                alt={file.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
                                                {file.base64}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">도움말</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>
                            이미지 파일을 드래그하여 놓거나 클릭하여 선택할 수 있습니다.
                        </li>
                        <li>
                            <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">V</kbd>를 눌러 클립보드의 이미지를 바로 변환할 수 있습니다.
                        </li>
                        <li>
                            변환된 Base64 문자열은 <code>data:image/[형식];base64,</code>로 시작합니다.
                        </li>
                        <li>
                            여러 이미지를 한 번에 변환할 수 있습니다.
                        </li>
                        <li>
                            "복사" 버튼을 클릭하여 Base64 문자열을 클립보드에 복사할 수 있습니다.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 