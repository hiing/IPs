import { NextRequest, NextResponse } from "next/server";
import ipaddr from "ipaddr.js";
import {
    isChinaValue,
    isHongKongText,
    shouldNormalizeHongKongLocation,
} from "../../../lib/hongKongDetection";

const PRIMARY_UPSTREAM_BASE = "https://ipinfo.dkly.net/api/";
const FALLBACK_UPSTREAMS = [
    "https://ipwho.is/",
    "https://ipapi.co",
] as const;

const REQUEST_TIMEOUT_MS = 8_000;
const SUCCESS_CACHE_CONTROL = "public, max-age=300, s-maxage=600, stale-while-revalidate=120";
const ERROR_CACHE_CONTROL = "no-store";

function isValidIP(ip: string): boolean {
    try {
        return ipaddr.isValid(ip);
    } catch {
        return false;
    }
}

function errorResponse(status: number, error: string, code: string, details?: unknown) {
    return NextResponse.json(
        {
            error,
            code,
            ...(details === undefined ? {} : { details }),
        },
        {
            status,
            headers: {
                "Cache-Control": ERROR_CACHE_CONTROL,
            },
        }
    );
}

async function fetchJsonWithTimeout(url: string, init?: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }
}

type PrimaryUpstreamResponse = Record<string, unknown>;

type FallbackPayload = {
    ip: string;
    type: string;
    hostname: string;
    connection: {
        asn: number;
        organization: string;
        type: string;
    };
    location: {
        continent: { code: string; name: string };
        country: { code: string; name: string; flag: { emoji: string } };
        region: { code: string; name: string };
        city: string;
        postal: string;
        latitude: number;
        longitude: number;
    };
    time_zone: {
        id: string;
        abbreviation: string;
        offset: number;
    };
    currency?: {
        code: string;
        name: string;
        symbol: string;
    };
    security: {
        is_vpn: boolean;
        is_proxy: boolean;
        is_tor: boolean;
        is_threat: boolean;
    };
    _meta?: {
        provider: string;
        degraded: boolean;
    };
};

function countryCodeToFlagEmoji(code: string | undefined): string {
    const normalized = (code ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) return "🌐";
    return String.fromCodePoint(...[...normalized].map((char) => 127397 + char.charCodeAt(0)));
}

function normalizeConnectionType(raw: unknown): string {
    const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!value) return "unknown";
    return value;
}

function asNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function buildFallbackPayloadFromIpWhois(source: Record<string, unknown>): FallbackPayload {
    const countryCode = asString(source.country_code, "");
    const countryName = asString(source.country, "Unknown");
    const latitude = asNumber(source.latitude, 0);
    const longitude = asNumber(source.longitude, 0);
    return {
        ip: asString(source.ip),
        type: asString(source.type, source.ip && asString(source.ip).includes(":") ? "IPv6" : "IPv4"),
        hostname: asString(source.connection && typeof source.connection === "object" ? (source.connection as Record<string, unknown>).domain : ""),
        connection: {
            asn: asNumber(source.connection && typeof source.connection === "object" ? (source.connection as Record<string, unknown>).asn : 0, 0),
            organization: asString(source.connection && typeof source.connection === "object" ? (source.connection as Record<string, unknown>).org : "Unknown"),
            type: normalizeConnectionType(source.connection && typeof source.connection === "object" ? (source.connection as Record<string, unknown>).type : "unknown"),
        },
        location: {
            continent: {
                code: asString(source.continent_code),
                name: asString(source.continent, "Unknown"),
            },
            country: {
                code: countryCode,
                name: countryName,
                flag: { emoji: countryCodeToFlagEmoji(countryCode) },
            },
            region: {
                code: asString(source.region_code),
                name: asString(source.region),
            },
            city: asString(source.city),
            postal: asString(source.postal),
            latitude,
            longitude,
        },
        time_zone: {
            id: asString(source.timezone),
            abbreviation: asString(source.timezone),
            offset: 0,
        },
        currency: undefined,
        security: {
            is_vpn: false,
            is_proxy: false,
            is_tor: false,
            is_threat: false,
        },
        _meta: {
            provider: "ipwho.is",
            degraded: true,
        },
    };
}

function buildFallbackPayloadFromIpApiCo(source: Record<string, unknown>): FallbackPayload {
    const countryCode = asString(source.country_code, "");
    const countryName = asString(source.country_name, "Unknown");
    const latitude = asNumber(source.latitude, 0);
    const longitude = asNumber(source.longitude, 0);
    return {
        ip: asString(source.ip),
        type: asString(source.version, asString(source.ip).includes(":") ? "IPv6" : "IPv4"),
        hostname: asString(source.hostname),
        connection: {
            asn: 0,
            organization: asString(source.org, "Unknown"),
            type: normalizeConnectionType(source.org ? "unknown" : "unknown"),
        },
        location: {
            continent: {
                code: "",
                name: "Unknown",
            },
            country: {
                code: countryCode,
                name: countryName,
                flag: { emoji: countryCodeToFlagEmoji(countryCode) },
            },
            region: {
                code: asString(source.region_code),
                name: asString(source.region),
            },
            city: asString(source.city),
            postal: asString(source.postal),
            latitude,
            longitude,
        },
        time_zone: {
            id: asString(source.timezone),
            abbreviation: asString(source.timezone),
            offset: 0,
        },
        currency: source.currency
            ? {
                  code: asString(source.currency),
                  name: asString(source.currency_name),
                  symbol: asString(source.currency_symbol),
              }
            : undefined,
        security: {
            is_vpn: false,
            is_proxy: false,
            is_tor: false,
            is_threat: false,
        },
        _meta: {
            provider: "ipapi.co",
            degraded: true,
        },
    };
}

async function fetchFromFallbackProviders(lookupIp: string): Promise<FallbackPayload | null> {
    for (const base of FALLBACK_UPSTREAMS) {
        const url = base === "https://ipwho.is/"
            ? `${base}${encodeURIComponent(lookupIp)}`
            : `${base}/${encodeURIComponent(lookupIp)}/json/`;

        try {
            const response = await fetchJsonWithTimeout(url, {
                headers: { Accept: "application/json", "User-Agent": "IP-Insight/1.0" },
            });
            if (!response.ok) continue;
            const data = (await response.json()) as Record<string, unknown>;

            if (base === "https://ipwho.is/") {
                if (data.success === false) continue;
                return buildFallbackPayloadFromIpWhois(data);
            }

            if (typeof data.error === "boolean" && data.error) continue;
            return buildFallbackPayloadFromIpApiCo(data);
        } catch {
            continue;
        }
    }

    return null;
}

// In-memory rate limiter (per-IP, resets on worker restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per client IP

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null;
}

function readErrorMessage(value: unknown): string {
    return isRecord(value) && typeof value.message === "string" ? value.message : "";
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

    if (
        !shouldNormalizeHongKongLocation({
            countryCode,
            countryName,
            regionCode,
            regionName,
            cityName,
            timeZoneId,
            timeZoneAbbreviation,
            currencyCode,
            currencyName,
            currencySymbol,
            latitude,
            longitude,
        })
    ) {
        return payload;
    }

    const normalizedCountry = ensureRecord(location, "country");
    normalizedCountry.code = "HK";
    normalizedCountry.name = "Hong Kong";

    const flag = ensureRecord(normalizedCountry, "flag");
    flag.emoji = "🇭🇰";

    const normalizedRegion = ensureRecord(location, "region");
    const normalizedRegionName = readString(normalizedRegion, "name");
    if (!normalizedRegionName || isHongKongText(normalizedRegionName) || isChinaValue(normalizedRegionName)) {
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

    // Rate limiting based on client IP
    const clientIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";

    if (!checkRateLimit(clientIp)) {
        return errorResponse(429, "Rate limit exceeded. Please try again later.", "RATE_LIMIT_EXCEEDED");
    }

    const { searchParams } = new URL(request.url);
    const ip = searchParams.get("ip");

    if (ip && !isValidIP(ip)) {
        return errorResponse(400, "Invalid IP address format", "INVALID_IP");
    }

    const lookupIp = ip || clientIp;

    if (!lookupIp || lookupIp === "unknown") {
        return errorResponse(400, "Unable to determine client IP address", "IP_UNAVAILABLE");
    }

    if (!apiKey) {
        const fallbackData = await fetchFromFallbackProviders(lookupIp);
        if (fallbackData) {
            const data = normalizeHongKongPayload(fallbackData);
            return NextResponse.json(data, {
                status: 200,
                headers: {
                    "Cache-Control": SUCCESS_CACHE_CONTROL,
                },
            });
        }

        return errorResponse(500, "API key not configured", "PRIMARY_API_KEY_MISSING");
    }

    const upstreamUrl = `${PRIMARY_UPSTREAM_BASE}?key=${apiKey}&ip=${encodeURIComponent(lookupIp)}`;

    try {
        const response = await fetchJsonWithTimeout(upstreamUrl, {
            headers: { Accept: "application/json", "User-Agent": "IP-Insight/1.0" },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = readErrorMessage(errorData);
            const hasNoCredits = /insufficient credits/i.test(message);
            const fallbackData = await fetchFromFallbackProviders(lookupIp);

            if (fallbackData) {
                const mergedFallback = {
                    ...fallbackData,
                    _meta: {
                        ...(fallbackData._meta ?? { provider: "fallback", degraded: true }),
                        primaryError: hasNoCredits ? "PRIMARY_NO_CREDITS" : "PRIMARY_UPSTREAM_ERROR",
                    },
                };
                const data = normalizeHongKongPayload(mergedFallback);
                return NextResponse.json(data, {
                    status: 200,
                    headers: {
                        "Cache-Control": SUCCESS_CACHE_CONTROL,
                    },
                });
            }

            return errorResponse(
                response.status,
                hasNoCredits ? "Primary upstream account has insufficient credits" : "Upstream API error",
                hasNoCredits ? "PRIMARY_NO_CREDITS" : "PRIMARY_UPSTREAM_ERROR",
                errorData
            );
        }

        const data = normalizeHongKongPayload((await response.json()) as PrimaryUpstreamResponse);

        return NextResponse.json(data, {
            status: 200,
            headers: {
                "Cache-Control": SUCCESS_CACHE_CONTROL,
            },
        });
    } catch (error) {
        const fallbackData = await fetchFromFallbackProviders(lookupIp);
        if (fallbackData) {
            const mergedFallback = {
                ...fallbackData,
                _meta: {
                    ...(fallbackData._meta ?? { provider: "fallback", degraded: true }),
                    primaryError: error instanceof Error && error.name === "AbortError" ? "PRIMARY_TIMEOUT" : "PRIMARY_FETCH_FAILED",
                },
            };
            const data = normalizeHongKongPayload(mergedFallback);
            return NextResponse.json(data, {
                status: 200,
                headers: {
                    "Cache-Control": SUCCESS_CACHE_CONTROL,
                },
            });
        }

        return errorResponse(
            502,
            error instanceof Error && error.name === "AbortError"
                ? "Primary upstream timeout"
                : "Failed to fetch IP information",
            error instanceof Error && error.name === "AbortError" ? "PRIMARY_TIMEOUT" : "PRIMARY_FETCH_FAILED"
        );
    }
}
