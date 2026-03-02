import { NextRequest, NextResponse } from "next/server";

// Simple IP format validation (IPv4 and IPv6)
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

function isValidIP(ip: string): boolean {
    if (IPV4_REGEX.test(ip)) {
        // Verify each octet is 0-255
        return ip.split(".").every((octet) => {
            const n = parseInt(octet, 10);
            return n >= 0 && n <= 255;
        });
    }
    return IPV6_REGEX.test(ip);
}

// In-memory rate limiter (per-IP, resets on worker restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per client IP

function checkRateLimit(clientIp: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(clientIp);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }

    entry.count++;
    return true;
}

export async function GET(request: NextRequest) {
    const apiKey = process.env.IPINFO_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "API key not configured" },
            { status: 500 }
        );
    }

    // Rate limiting based on client IP
    const clientIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";

    if (!checkRateLimit(clientIp)) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            { status: 429 }
        );
    }

    const { searchParams } = new URL(request.url);
    const ip = searchParams.get("ip");

    // Validate IP format before forwarding
    if (ip && !isValidIP(ip)) {
        return NextResponse.json(
            { error: "Invalid IP address format" },
            { status: 400 }
        );
    }

    // Build upstream URL
    let upstreamUrl = `https://ipinfo.dkly.net/api/?key=${apiKey}`;
    if (ip) {
        upstreamUrl += `&ip=${encodeURIComponent(ip)}`;
    }

    try {
        const response = await fetch(upstreamUrl, {
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: "Upstream API error", details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json(data, {
            status: 200,
            headers: {
                "Cache-Control": "public, max-age=300, s-maxage=600",
            },
        });
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch IP information" },
            { status: 502 }
        );
    }
}
