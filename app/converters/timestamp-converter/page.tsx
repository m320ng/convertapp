'use client';

import { useState } from 'react';

export default function TimestampConverter() {
    const [timestamp, setTimestamp] = useState('');
    const [date, setDate] = useState('');
    const [error, setError] = useState<string | null>(null);

    const convertTimestampToDate = (ts: string) => {
        try {
            setError(null);
            const num = parseInt(ts);
            if (isNaN(num)) {
                throw new Error('유효한 Unix timestamp가 아닙니다.');
            }

            // 밀리초 단위인지 초 단위인지 확인
            const timestamp = num.toString().length > 10 ? num : num * 1000;
            const dateObj = new Date(timestamp);

            if (dateObj.toString() === 'Invalid Date') {
                throw new Error('유효한 Unix timestamp가 아닙니다.');
            }

            // ISO 문자열에서 밀리초와 Z 제거
            const isoString = dateObj.toISOString();
            const formattedDate = isoString.substring(0, 19);
            setDate(formattedDate);
        } catch (err) {
            setError(err instanceof Error ? err.message : '변환 중 오류가 발생했습니다.');
            setDate('');
        }
    };

    const convertDateToTimestamp = (dateStr: string) => {
        try {
            setError(null);
            const dateObj = new Date(dateStr);

            if (dateObj.toString() === 'Invalid Date') {
                throw new Error('유효한 날짜가 아닙니다.');
            }

            const ts = Math.floor(dateObj.getTime() / 1000);
            setTimestamp(ts.toString());
        } catch (err) {
            setError(err instanceof Error ? err.message : '변환 중 오류가 발생했습니다.');
            setTimestamp('');
        }
    };

    const handleTimestampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTimestamp(value);
        if (value.trim()) {
            convertTimestampToDate(value);
        } else {
            setDate('');
            setError(null);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDate(value);
        if (value.trim()) {
            convertDateToTimestamp(value);
        } else {
            setTimestamp('');
            setError(null);
        }
    };

    const getCurrentTimestamp = () => {
        const now = Math.floor(Date.now() / 1000);
        setTimestamp(now.toString());
        convertTimestampToDate(now.toString());
    };

    const getCurrentDate = () => {
        const now = new Date();
        const isoString = now.toISOString();
        const formattedDate = isoString.substring(0, 19);
        setDate(formattedDate);
        convertDateToTimestamp(formattedDate);
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Unix Timestamp ↔ 날짜 변환기</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Unix Timestamp 입력 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-lg font-semibold">
                                Unix Timestamp
                            </label>
                            <button
                                onClick={getCurrentTimestamp}
                                className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                                현재 시간 가져오기
                            </button>
                        </div>
                        <input
                            type="text"
                            value={timestamp}
                            onChange={handleTimestampChange}
                            placeholder="예: 1704067200"
                            className="w-full p-3 border rounded-lg font-mono text-sm"
                        />
                        <p className="text-sm text-gray-500">
                            초 단위(10자리) 또는 밀리초 단위(13자리)를 입력하세요
                        </p>
                    </div>

                    {/* 일반 날짜 입력 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-lg font-semibold">
                                날짜
                            </label>
                            <button
                                onClick={getCurrentDate}
                                className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                                현재 시간 가져오기
                            </button>
                        </div>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={handleDateChange}
                            step="1"
                            className="w-full p-3 border rounded-lg font-mono text-sm"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">도움말</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>
                            Unix timestamp는 1970년 1월 1일 00:00:00 UTC부터 경과한 시간을 초 단위로 나타낸 값입니다.
                        </li>
                        <li>
                            초 단위(10자리)와 밀리초 단위(13자리) 모두 지원합니다.
                        </li>
                        <li>
                            날짜 입력은 브라우저의 datetime-local 입력을 사용하며, 초 단위까지 지원합니다.
                        </li>
                        <li>
                            "현재 시간 가져오기" 버튼을 클릭하면 현재 시간이 자동으로 입력됩니다.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 