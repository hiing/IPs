"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Map as LeafletMap } from "leaflet";
import { type Locale, t, tf } from "../i18n/translations";

// ===== Types =====
interface IPData {
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
        provider?: string;
        degraded?: boolean;
        primaryError?: string;
    };
}

type Theme = "light" | "dark";

type ApiErrorPayload = {
    error?: string;
    code?: string;
};

function mapErrorMessage(locale: Locale, payload: ApiErrorPayload | null, status: number): string {
    switch (payload?.code) {
        case "INVALID_IP":
            return t(locale, "error.invalidIp");
        case "RATE_LIMIT_EXCEEDED":
            return t(locale, "error.rateLimited");
        case "PRIMARY_NO_CREDITS":
            return t(locale, "error.primaryNoCredits");
        case "PRIMARY_TIMEOUT":
            return t(locale, "error.primaryTimeout");
        case "PRIMARY_FETCH_FAILED":
        case "PRIMARY_UPSTREAM_ERROR":
            return t(locale, "error.primaryFetchFailed");
        case "IP_UNAVAILABLE":
            return t(locale, "error.ipUnavailable");
        default:
            return payload?.error || (status >= 500 ? t(locale, "error.generic") : `Request failed (${status})`);
    }
}

const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// ===== Map Component (lazy loaded) =====
function MapView({ lat, lng, theme }: { lat: number; lng: number; theme: Theme }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<LeafletMap | null>(null);

    useEffect(() => {
        if (!mapRef.current || typeof window === "undefined") return;
        let isDisposed = false;

        const loadMap = async () => {
            const L = (await import("leaflet")).default;
            if (isDisposed || !mapRef.current) return;

            const defaultIconPrototype = L.Icon.Default.prototype as typeof L.Icon.Default.prototype & {
                _getIconUrl?: string;
            };
            delete defaultIconPrototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const tileUrl = theme === "dark" ? DARK_TILE_URL : LIGHT_TILE_URL;

            const map = L.map(mapRef.current!, {
                zoomControl: true,
                attributionControl: false,
            }).setView([lat, lng], 12);

            L.tileLayer(tileUrl, {
                maxZoom: 19,
            }).addTo(map);

            L.marker([lat, lng]).addTo(map);
            mapInstanceRef.current = map;

            // Fix rendering in hidden containers
            window.setTimeout(() => {
                if (!isDisposed) {
                    map.invalidateSize();
                }
            }, 100);
        };

        loadMap();

        return () => {
            isDisposed = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng, theme]);

    return <div ref={mapRef} className="map-container" />;
}

// ===== Security Badge =====
function SecurityBadge({
    label,
    detected,
    icon,
    locale,
}: {
    label: string;
    detected: boolean;
    icon: string;
    locale: Locale;
}) {
    return (
        <div className={`security-badge ${detected ? "threat" : "safe"}`}>
            <div className={`badge-indicator ${detected ? "threat" : "safe"}`} />
            <div className="badge-text">
                <span className="badge-label">
                    {icon} {label}
                </span>
                <span className={`badge-status ${detected ? "threat" : "safe"}`}>
                    {detected ? t(locale, "security.detected") : t(locale, "security.notDetected")}
                </span>
            </div>
        </div>
    );
}

// ===== Info Row =====
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="info-row">
            <span className="info-label">{label}</span>
            <span className="info-value">{value}</span>
        </div>
    );
}

const API_NORMALIZATION_VERSION = "hk-normalize-v2";
const HONG_KONG_KEYWORDS = [/hong kong/i, /香港/u];
const HONG_KONG_DISTRICT_KEYWORDS = [
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

function canonicalizeHongKongString(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "")
        .replace(/[-_]/g, "")
        .replace(/[^a-z0-9\u4e00-\u9fa5$]/g, "");
}

const HK_ALIAS_RAW: string[] = [
    "hong kong",
    "hong kong sar",
    "香港特别行政区",
    "香港特別行政區",
    "中国香港",
    "中國香港",
    "hksar",
    "hk",
    "hkt",
    "hkst",
    "hk dollar",
    "hong kong dollar",
    "hk$",
    "hkg",
];
const HK_CANONICALS = new Set<string>(HK_ALIAS_RAW.map((s) => canonicalizeHongKongString(s)));
// Markers for containment-based HK detection
const HK_MARKERS_RAW: string[] = [
    "hong kong",
    "hong kong sar",
    "香港特别行政区",
    "香港特別行政區",
    "中国香港",
    "中國香港",
    "hksar",
    "kowloon",
    "new territories",
    "hong kong island",
    "hong kong island",
    "九龙",
    "九龍",
    "新界",
    "香港島",
    "香港岛",
    "prc hong kong sar",
    "china hong kong",
];
const HK_MARKERS_CANONICALS = new Set<string>(HK_MARKERS_RAW.map((s) => canonicalizeHongKongString(s)));

function isHongKongValue(value: string | undefined): boolean {
    const v = value ?? "";
    const canon = canonicalizeHongKongString(v);
    return HK_CANONICALS.has(canon);
}

function isHongKongDistrict(value: string | undefined): boolean {
    return value ? HONG_KONG_DISTRICT_KEYWORDS.some((pattern) => pattern.test(value)) : false;
}

function isChinaValue(value: string | undefined): boolean {
    return value ? /china|中国|中國/i.test(value) : false;
}

function isHongKongCoordinate(latitude: number, longitude: number): boolean {
    return latitude >= 22.15 && latitude <= 22.6 && longitude >= 113.8 && longitude <= 114.5;
}


function isHongKongLocation(data: Pick<IPData, "location" | "time_zone" | "currency">): boolean {
    const countryCode = data.location.country.code?.toUpperCase() ?? "";
    const countryName = data.location.country.name;
    const regionCode = data.location.region.code?.toUpperCase() ?? "";
    const regionName = data.location.region.name;
    const currencyCode = data.currency?.code?.toUpperCase() ?? "";
    const cityName = data.location.city;
    const timeZoneId = data.time_zone.id?.toUpperCase() ?? "";
    const timeZoneAbbreviation = data.time_zone.abbreviation?.toUpperCase() ?? "";
    const currencyName = data.currency?.name;
    const currencySymbol = data.currency?.symbol;

    const currencyNameIsHK = isHongKongValue(currencyName);
    const currencySymbolIsHK = !!currencySymbol && currencySymbol.toUpperCase().includes("HK$");
    const currencyCodeIsHKD = currencyCode === "HKD";
    const isHKCurrency = currencyCodeIsHKD || currencyNameIsHK || currencySymbolIsHK;

    const hasHongKongTextSignal =
        isHongKongValue(countryName) ||
        isHongKongValue(regionName) ||
        isHongKongValue(cityName) ||
        isHongKongDistrict(regionName) ||
        isHongKongDistrict(cityName);
    const hasHongKongCoordinateSignal = isHongKongCoordinate(data.location.latitude, data.location.longitude);
    const hasHongKongTimeZoneSignal =
        timeZoneId === "ASIA/HONG_KONG" || timeZoneAbbreviation === "HKT" || timeZoneAbbreviation === "HKST";
    const looksLikeChina =
        countryCode === "CN" || isChinaValue(countryName) || currencyCode === "CNY" || currencySymbol === "¥";

    return (
        countryCode === "HK" ||
        countryCode === "HKG" ||
        countryCode === "CN-HK" ||
        regionCode === "HK" ||
        isHKCurrency ||
        hasHongKongTextSignal ||
        hasHongKongTimeZoneSignal ||
        (looksLikeChina && (hasHongKongTimeZoneSignal || hasHongKongTextSignal)) ||
        (hasHongKongCoordinateSignal && (hasHongKongTimeZoneSignal || hasHongKongTextSignal))
    );
}

// ===== Main Dashboard =====
export default function IPDashboard({ locale, theme }: { locale: Locale; theme: Theme }) {
    const [ipData, setIpData] = useState<IPData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchIp, setSearchIp] = useState("");
    const [copied, setCopied] = useState(false);

    const fetchIPData = useCallback(async (ip?: string) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ v: API_NORMALIZATION_VERSION });
            if (ip) {
                params.set("ip", ip);
            }

            const res = await fetch(`/api/ipinfo?${params.toString()}`, {
                cache: "no-store",
            });
            if (!res.ok) {
                const errorData: ApiErrorPayload | null = await res.json().catch(() => null);
                throw new Error(mapErrorMessage(locale, errorData, res.status));
            }
            const data: IPData = await res.json();
            setIpData(data);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Failed to fetch IP data");
        } finally {
            setLoading(false);
        }
    }, [locale]);

    useEffect(() => {
        fetchIPData();
    }, [fetchIPData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchIp.trim();
        if (trimmed) {
            fetchIPData(trimmed);
        }
    };

    const handleMyIP = () => {
        setSearchIp("");
        fetchIPData();
    };

    const handleCopy = () => {
        if (ipData?.ip) {
            navigator.clipboard.writeText(ipData.ip);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatOffset = (seconds: number) => {
        const hours = seconds / 3600;
        const sign = hours >= 0 ? "+" : "";
        return `UTC${sign}${hours}`;
    };

    // ===== Loading State =====
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">{t(locale, "loading.text")}</p>
            </div>
        );
    }

    // ===== Error State =====
    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3 className="error-title">{t(locale, "error.title")}</h3>
                <p className="error-message">{error}</p>
                <button className="retry-btn" onClick={() => fetchIPData()}>
                    {t(locale, "error.retry")}
                </button>
            </div>
        );
    }

    if (!ipData) return null;

    const { location, connection, time_zone, currency, security } = ipData;
    const dataMeta = ipData._meta;
    const shouldNormalizeHongKong = isHongKongLocation({ location, time_zone, currency });
    const displayCountry = shouldNormalizeHongKong
        ? {
              code: "HK",
              name: "Hong Kong",
              flagEmoji: "🇭🇰",
          }
        : {
              code: location.country.code,
              name: location.country.name,
              flagEmoji: location.country.flag.emoji,
          };
    const displayCurrency = shouldNormalizeHongKong
        ? {
              code: "HKD",
              name: "Hong Kong Dollar",
              symbol: "HK$",
          }
        : currency;
    const hasDedicatedRegion =
        Boolean(location.region.name) &&
        (!shouldNormalizeHongKong || !isHongKongValue(location.region.name)) &&
        location.region.name.trim().toLowerCase() !== displayCountry.name.trim().toLowerCase();

    return (
        <>
            {/* Degraded Mode Notice */}
            {dataMeta?.degraded && (
                <div className="glass-card animate-in" style={{ marginBottom: "1rem", border: "1px solid rgba(245, 158, 11, 0.35)" }}>
                    <div className="card-header">
                        <div className="card-icon security">⚠️</div>
                        <span className="card-title">{t(locale, "notice.partialTitle")}</span>
                    </div>
                    <div className="card-body">
                        <p style={{ margin: 0, lineHeight: 1.6 }}>
                            {tf(locale, "notice.partialBody", { provider: dataMeta.provider || "fallback" })}
                        </p>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="search-container">
                <form onSubmit={handleSearch}>
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            id="ip-search-input"
                            type="text"
                            className="search-input"
                            placeholder={t(locale, "search.placeholder")}
                            aria-label="IP address to lookup"
                            value={searchIp}
                            onChange={(e) => setSearchIp(e.target.value)}
                        />
                        <button
                            id="search-btn"
                            type="submit"
                            className="search-btn"
                            disabled={!searchIp.trim()}
                        >
                            {t(locale, "search.btn")}
                        </button>
                    </div>
                </form>
                <button id="my-ip-btn" className="my-ip-btn" onClick={handleMyIP} aria-label="Detect my IP address">
                    {t(locale, "search.myip")}
                </button>
            </div>

            {/* IP Header Card */}
            <div className="ip-header-card animate-in">
                <div className="ip-main-info">
                    <span className="ip-flag">{displayCountry.flagEmoji}</span>
                    <div className="ip-details">
                        <h2>{ipData.ip}</h2>
                        <div className="ip-meta">
                            <span className="tag">{ipData.type}</span>
                            {ipData.hostname && (
                                <span>{ipData.hostname}</span>
                            )}
                            <button className="copy-btn" onClick={handleCopy} aria-label="Copy IP address to clipboard">
                                {copied ? t(locale, "copy.done") : t(locale, "copy.btn")}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="ip-location-text">
                    <div className="city">{location.city}</div>
                    <div>
                        {hasDedicatedRegion ? `${location.region.name}, ${displayCountry.name}` : displayCountry.name}
                    </div>
                    <div>{location.continent.name}</div>
                </div>
            </div>

            {/* Map */}
            <div className="glass-card map-card animate-in">
                <div className="card-header">
                    <div className="card-icon location">📍</div>
                    <span className="card-title">{t(locale, "card.map")}</span>
                </div>
                <MapView lat={location.latitude} lng={location.longitude} theme={theme} />
                <div className="map-coords">
                    <span>📐 {t(locale, "field.lat")}: {location.latitude.toFixed(4)}</span>
                    <span>📐 {t(locale, "field.lng")}: {location.longitude.toFixed(4)}</span>
                    {location.postal && <span>📮 {t(locale, "field.postal")}: {location.postal}</span>}
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="info-grid">
                {/* Location Card */}
                <div className="glass-card animate-in">
                    <div className="card-header">
                        <div className="card-icon location">🌍</div>
                        <span className="card-title">{t(locale, "card.location")}</span>
                    </div>
                    <div className="card-body">
                        <InfoRow label={t(locale, "field.continent")} value={`${location.continent.name} (${location.continent.code})`} />
                        <InfoRow label={t(locale, "field.country")} value={`${displayCountry.flagEmoji} ${displayCountry.name} (${displayCountry.code})`} />
                        <InfoRow label={t(locale, "field.region")} value={hasDedicatedRegion ? `${location.region.name} (${location.region.code})` : t(locale, "na")} />
                        <InfoRow label={t(locale, "field.city")} value={location.city} />
                        <InfoRow label={t(locale, "field.postal")} value={location.postal || t(locale, "na")} />
                    </div>
                </div>

                {/* Network Card */}
                <div className="glass-card animate-in">
                    <div className="card-header">
                        <div className="card-icon network">🌐</div>
                        <span className="card-title">{t(locale, "card.network")}</span>
                    </div>
                    <div className="card-body">
                        <InfoRow label={t(locale, "field.asn")} value={connection.asn ? `AS${connection.asn}` : t(locale, "na")} />
                        <InfoRow label={t(locale, "field.org")} value={connection.organization || t(locale, "na")} />
                        <InfoRow label={t(locale, "field.connType")} value={connection.type || t(locale, "na")} />
                        <InfoRow label={t(locale, "field.hostname")} value={ipData.hostname || t(locale, "na")} />
                    </div>
                </div>

                {/* Timezone Card */}
                <div className="glass-card animate-in">
                    <div className="card-header">
                        <div className="card-icon time">🕐</div>
                        <span className="card-title">{t(locale, "card.timezone")}</span>
                    </div>
                    <div className="card-body">
                        <InfoRow label={t(locale, "field.timezone")} value={time_zone.id} />
                        <InfoRow label={t(locale, "field.abbreviation")} value={time_zone.abbreviation} />
                        <InfoRow label={t(locale, "field.utcOffset")} value={formatOffset(time_zone.offset)} />
                    </div>
                </div>

                {/* Currency Card */}
                {displayCurrency && (
                    <div className="glass-card animate-in">
                        <div className="card-header">
                            <div className="card-icon currency">💰</div>
                            <span className="card-title">{t(locale, "card.currency")}</span>
                        </div>
                        <div className="card-body">
                            <InfoRow label={t(locale, "field.currency")} value={displayCurrency.name} />
                            <InfoRow label={t(locale, "field.code")} value={displayCurrency.code} />
                            <InfoRow label={t(locale, "field.symbol")} value={displayCurrency.symbol} />
                        </div>
                    </div>
                )}
            </div>

            {/* Security Card */}
            <div className="glass-card animate-in">
                <div className="card-header">
                    <div className="card-icon security">🛡️</div>
                    <span className="card-title">{t(locale, "card.security")}</span>
                </div>
                <div className="security-grid">
                    <SecurityBadge label={t(locale, "security.vpn")} detected={security.is_vpn} icon="🔒" locale={locale} />
                    <SecurityBadge label={t(locale, "security.proxy")} detected={security.is_proxy} icon="🔄" locale={locale} />
                    <SecurityBadge label={t(locale, "security.tor")} detected={security.is_tor} icon="🧅" locale={locale} />
                    <SecurityBadge label={t(locale, "security.threat")} detected={security.is_threat} icon="⚠️" locale={locale} />
                </div>
            </div>
        </>
    );
}
