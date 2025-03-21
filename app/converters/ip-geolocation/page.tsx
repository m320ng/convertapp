'use client';

import { useState, useEffect } from 'react';

interface GeoLocation {
    ip: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    latitude: number;
    longitude: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
}

export default function IpGeolocation() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<GeoLocation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isValidIp = (ip: string) => {
        // IPv4 검증
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipv4Regex.test(ip)) {
            const parts = ip.split('.');
            return parts.every(part => {
                const num = parseInt(part, 10);
                return num >= 0 && num <= 255;
            });
        }
        // IPv6 검증 (간단한 형식 체크)
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv6Regex.test(ip);
    };

    const fetchGeoLocation = async (ip: string) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!isValidIp(ip)) {
                throw new Error('유효한 IP 주소가 아닙니다.');
            }

            const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
            const data = await response.json();

            if (data.status === 'fail') {
                throw new Error(data.message || 'IP 주소 조회에 실패했습니다.');
            }

            setResult({
                ip: data.query,
                country: data.country,
                countryCode: data.countryCode,
                region: data.region,
                regionName: data.regionName,
                city: data.city,
                zip: data.zip,
                latitude: data.lat,
                longitude: data.lon,
                timezone: data.timezone,
                isp: data.isp,
                org: data.org,
                as: data.as
            });
        } catch (err) {
            console.error('IP 조회 중 오류:', err);
            setError(err instanceof Error ? err.message : 'IP 주소 조회에 실패했습니다.');
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            fetchGeoLocation(input.trim());
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('클립보드에 복사되었습니다!');
        } catch (error) {
            console.error('복사 실패:', error);
            alert('클립보드에 복사하지 못했습니다');
        }
    };

    // 초기 로딩 시 클라이언트 IP 가져오기
    useEffect(() => {
        const fetchClientIp = async () => {
            try {
                const response = await fetch('http://ip-api.com/json/?fields=query');
                const data = await response.json();
                if (data.query) {
                    setInput(data.query);
                    fetchGeoLocation(data.query);
                }
            } catch (err) {
                console.error('클라이언트 IP 조회 실패:', err);
            }
        };

        fetchClientIp();
    }, []);

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">IP → 위치정보 변환기</h1>

                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="IP 주소를 입력하세요 (예: 8.8.8.8)"
                            className="w-full p-3 border rounded-lg font-mono text-sm"
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                            disabled={isLoading}
                        >
                            {isLoading ? '조회 중...' : '위치 조회'}
                        </button>
                    </div>
                </form>

                {input.trim() && (
                    <div className="mb-6">
                        <div className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">입력된 IP</h3>
                                <button
                                    onClick={() => copyToClipboard(input)}
                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                >
                                    복사
                                </button>
                            </div>
                            <pre className="bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                                {input}
                            </pre>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">위치 정보</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-3">기본 정보</h3>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">국가:</dt>
                                        <dd>{result.country} ({result.countryCode})</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">지역:</dt>
                                        <dd>{result.regionName} ({result.region})</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">도시:</dt>
                                        <dd>{result.city}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">우편번호:</dt>
                                        <dd>{result.zip || '-'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">시간대:</dt>
                                        <dd>{result.timezone}</dd>
                                    </div>
                                </dl>
                            </div>
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-3">네트워크 정보</h3>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">ISP:</dt>
                                        <dd>{result.isp}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">조직:</dt>
                                        <dd>{result.org}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">AS:</dt>
                                        <dd>{result.as}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">좌표:</dt>
                                        <dd>
                                            <a
                                                href={`https://www.google.com/maps?q=${result.latitude},${result.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-600"
                                            >
                                                {result.latitude}, {result.longitude}
                                            </a>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">도움말</h2>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                        <li>
                            IPv4와 IPv6 주소를 모두 지원합니다.
                        </li>
                        <li>
                            페이지 접속 시 자동으로 현재 IP 주소의 위치 정보를 조회합니다.
                        </li>
                        <li>
                            다른 IP 주소를 입력하여 해당 IP의 위치 정보를 조회할 수 있습니다.
                        </li>
                        <li>
                            좌표를 클릭하면 Google Maps에서 해당 위치를 확인할 수 있습니다.
                        </li>
                        <li>
                            무료 IP Geolocation API를 사용하므로, 요청 횟수에 제한이 있을 수 있습니다.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 