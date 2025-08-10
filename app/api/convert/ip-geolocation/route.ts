import { NextResponse } from 'next/server';

interface GeoLocationResponse {
    status: string;
    message?: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    query: string;
}

export async function POST(request: Request) {
    try {
        const { ip } = await request.json();

        if (!ip) {
            return NextResponse.json(
                { error: 'IP 주소가 제공되지 않았습니다' },
                { status: 400 }
            );
        }

        // IP 유효성 검사
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

        if (!isValidIp(ip)) {
            return NextResponse.json(
                { error: '유효한 IP 주소가 아닙니다' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
        );

        if (!response.ok) {
            throw new Error('IP API 요청에 실패했습니다');
        }

        const data: GeoLocationResponse = await response.json();

        if (data.status === 'fail') {
            return NextResponse.json(
                { error: data.message || 'IP 주소 조회에 실패했습니다' },
                { status: 400 }
            );
        }

        return NextResponse.json({
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

    } catch (error) {
        console.error('IP 지역 조회 오류:', error);
        return NextResponse.json(
            { error: 'IP 주소 조회에 실패했습니다' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // 클라이언트 IP를 가져오기 위한 엔드포인트
        const response = await fetch('http://ip-api.com/json/?fields=query');
        
        if (!response.ok) {
            throw new Error('클라이언트 IP 조회에 실패했습니다');
        }

        const data = await response.json();
        return NextResponse.json({ ip: data.query });

    } catch (error) {
        console.error('클라이언트 IP 조회 오류:', error);
        return NextResponse.json(
            { error: '클라이언트 IP 조회에 실패했습니다' },
            { status: 500 }
        );
    }
}