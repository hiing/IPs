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

type JsonRecord = Record<string, unknown>;

const HONG_KONG_CODE_SET = new Set(["HK", "HKG", "CN-HK"]);
const HONG_KONG_TIME_ZONE_SET = new Set(["ASIA/HONG_KONG"]);
const HONG_KONG_TIME_ZONE_ABBREVIATION_SET = new Set(["HKT", "HKST"]);
const HONG_KONG_TEXT_PATTERNS = [/hong\s*kong/i, /香港/u];
const HONG_KONG_DISTRICT_PATTERNS = [
    /kowloon/i,
    /quarry bay/i,
    /causeway bay/i,
    /wan chai/i,
    /wong tai sin/i,
    /tsim sha tsui/i,
    /sha tin/i,
    /tsuen wan/i,
    /kwun tong/i,
    /yuen long/i,
    /tuen mun/i,
    /tai po/i,
    /sai kung/i,
    /hong kong island/i,
    /new territories/i,
    /eastern district/i,
    /southern district/i,
    /north district/i,
    /islands district/i,
    /yau tsim mong/i,
    /九龍/u,
    /新界/u,
    /灣仔/u,
    /黄大仙/u,
    /黃大仙/u,
    /沙田/u,
    /荃灣/u,
    /觀塘/u,
    /元朗/u,
    /屯門/u,
    /大埔/u,
    /西貢/u,
    /港島/u,
];
const CHINA_TEXT_PATTERNS = [/china/i, /中国/u, /中國/u];

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null;
}

function readRecord(source: JsonRecord, key: string): JsonRecord | undefined {
    const value = source[key];
    return isRecord(value) ? value : undefined;
}

function readString(source: JsonRecord | undefined, key: string): string | undefined {
    const value = source?.[key];
    return typeof value === "string" ? value : undefined;
}

function readNumber(source: JsonRecord | undefined, key: string): number | undefined {
    const value = source?.[key];
    return typeof value === "number" ? value : undefined;
}

function ensureRecord(source: JsonRecord, key: string): JsonRecord {
    const existing = readRecord(source, key);
    if (existing) {
        return existing;
    }

    const created: JsonRecord = {};
    source[key] = created;
    return created;
}

function matchesAnyPattern(value: string | undefined, patterns: RegExp[]): boolean {
    return value ? patterns.some((pattern) => pattern.test(value)) : false;
}

function isHongKongText(value: string | undefined): boolean {
    return matchesAnyPattern(value, HONG_KONG_TEXT_PATTERNS);
}

function isHongKongDistrict(value: string | undefined): boolean {
    return matchesAnyPattern(value, HONG_KONG_DISTRICT_PATTERNS);
}

function isChinaText(value: string | undefined): boolean {
    return matchesAnyPattern(value, CHINA_TEXT_PATTERNS);
}

function isHongKongCoordinate(latitude: number | undefined, longitude: number | undefined): boolean {
    if (latitude === undefined || longitude === undefined) {
        return false;
    }

    return latitude >= 22.15 && latitude <= 22.6 && longitude >= 113.8 && longitude <= 114.5;
}

function normalizeHongKongPayload(payload: unknown): unknown {
    if (!isRecord(payload)) {
        return payload;
    }

    const location = readRecord(payload, "location");
    if (!location) {
        return payload;
    }

    const country = readRecord(location, "country");
    const region = readRecord(location, "region");
    const timeZone = readRecord(payload, "time_zone");
    const currency = readRecord(payload, "currency");

    const countryCode = readString(country, "code")?.toUpperCase() ?? "";
    const countryName = readString(country, "name");
    const regionCode = readString(region, "code")?.toUpperCase() ?? "";
    const regionName = readString(region, "name");
    const cityName = readString(location, "city");
    const timeZoneId = readString(timeZone, "id")?.toUpperCase() ?? "";
    const timeZoneAbbreviation = readString(timeZone, "abbreviation")?.toUpperCase() ?? "";
    const currencyCode = readString(currency, "code")?.toUpperCase() ?? "";
    const currencyName = readString(currency, "name");
    const currencySymbol = readString(currency, "symbol");
    const latitude = readNumber(location, "latitude");
    const longitude = readNumber(location, "longitude");

    const hasHongKongCodeSignal = HONG_KONG_CODE_SET.has(countryCode) || HONG_KONG_CODE_SET.has(regionCode);
    const hasHongKongTimeZoneSignal =
        HONG_KONG_TIME_ZONE_SET.has(timeZoneId) || HONG_KONG_TIME_ZONE_ABBREVIATION_SET.has(timeZoneAbbreviation);
    const hasHongKongTextSignal =
        isHongKongText(countryName) ||
        isHongKongText(regionName) ||
        isHongKongText(cityName) ||
        isHongKongDistrict(regionName) ||
        isHongKongDistrict(cityName);
    const hasHongKongCurrencySignal =
        currencyCode === "HKD" || currencySymbol === "HK$" || isHongKongText(currencyName);
    const hasHongKongCoordinateSignal = isHongKongCoordinate(latitude, longitude);
    const looksLikeChina =
        countryCode === "CN" || isChinaText(countryName) || currencyCode === "CNY" || currencySymbol === "¥";

    const shouldNormalizeHongKong =
        hasHongKongCodeSignal ||
        hasHongKongCurrencySignal ||
        hasHongKongTimeZoneSignal ||
        hasHongKongTextSignal ||
        (looksLikeChina && (hasHongKongTimeZoneSignal || hasHongKongTextSignal)) ||
        (hasHongKongCoordinateSignal && (hasHongKongTimeZoneSignal || hasHongKongTextSignal));

    if (!shouldNormalizeHongKong) {
        return payload;
    }

    const normalizedCountry = ensureRecord(location, "country");
    normalizedCountry.code = "HK";
    normalizedCountry.name = "Hong Kong";

    const flag = ensureRecord(normalizedCountry, "flag");
    flag.emoji = "🇭🇰";

    const normalizedRegion = ensureRecord(location, "region");
    const normalizedRegionName = readString(normalizedRegion, "name");
    if (!normalizedRegionName || isHongKongText(normalizedRegionName) || isChinaText(normalizedRegionName)) {
        normalizedRegion.name = "Hong Kong";
        normalizedRegion.code = "HK";
    } else if (!readString(normalizedRegion, "code")) {
        normalizedRegion.code = "HK";
    }

    const normalizedCurrency = ensureRecord(payload, "currency");
    normalizedCurrency.code = "HKD";
    normalizedCurrency.name = "Hong Kong Dollar";
    normalizedCurrency.symbol = "HK$";

    const normalizedTimeZone = ensureRecord(payload, "time_zone");
    normalizedTimeZone.id = "Asia/Hong_Kong";
    normalizedTimeZone.abbreviation = "HKT";
    if (readNumber(normalizedTimeZone, "offset") === undefined) {
        normalizedTimeZone.offset = 28_800;
    }

    return payload;
}

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

    // Build upstream URL — always pass an explicit IP to the upstream API.
    // Without an explicit IP, the upstream returns the Worker's own edge-node
    // IP, which changes on every request and causes the "random IP" bug.
    const lookupIp = ip || clientIp;

    if (!lookupIp || lookupIp === "unknown") {
        return NextResponse.json(
            { error: "Unable to determine client IP address" },
            { status: 400 }
        );
    }

    const upstreamUrl = `https://ipinfo.dkly.net/api/?key=${apiKey}&ip=${encodeURIComponent(lookupIp)}`;

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

        const data = normalizeHongKongPayload(await response.json());

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
