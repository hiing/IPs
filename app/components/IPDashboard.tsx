"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
}

// ===== Map Component (lazy loaded) =====
function MapView({ lat, lng }: { lat: number; lng: number }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || typeof window === "undefined") return;

        const loadMap = async () => {
            const L = (await import("leaflet")).default;

            // Fix default marker icon
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl:
                    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([lat, lng], 12);
                mapInstanceRef.current.eachLayer((layer: any) => {
                    if (layer instanceof L.Marker) {
                        mapInstanceRef.current.removeLayer(layer);
                    }
                });
                L.marker([lat, lng]).addTo(mapInstanceRef.current);
                return;
            }

            const map = L.map(mapRef.current!, {
                zoomControl: true,
                attributionControl: false,
            }).setView([lat, lng], 12);

            L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                {
                    maxZoom: 19,
                }
            ).addTo(map);

            L.marker([lat, lng]).addTo(map);
            mapInstanceRef.current = map;

            // Fix rendering in hidden containers
            setTimeout(() => map.invalidateSize(), 100);
        };

        loadMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng]);

    return <div ref={mapRef} className="map-container" />;
}

// ===== Security Badge =====
function SecurityBadge({
    label,
    detected,
    icon,
}: {
    label: string;
    detected: boolean;
    icon: string;
}) {
    return (
        <div className={`security-badge ${detected ? "threat" : "safe"}`}>
            <div className={`badge-indicator ${detected ? "threat" : "safe"}`} />
            <div className="badge-text">
                <span className="badge-label">
                    {icon} {label}
                </span>
                <span className={`badge-status ${detected ? "threat" : "safe"}`}>
                    {detected ? "Detected" : "Not Detected"}
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

// ===== Main Dashboard =====
export default function IPDashboard() {
    const [ipData, setIpData] = useState<IPData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchIp, setSearchIp] = useState("");
    const [copied, setCopied] = useState(false);

    const fetchIPData = useCallback(async (ip?: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = ip
                ? `/api/ipinfo?ip=${encodeURIComponent(ip)}`
                : `/api/ipinfo`;
            const res = await fetch(url);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Request failed (${res.status})`);
            }
            const data: IPData = await res.json();
            setIpData(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch IP data");
        } finally {
            setLoading(false);
        }
    }, []);

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
                <p className="loading-text">Analyzing IP address...</p>
            </div>
        );
    }

    // ===== Error State =====
    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3 className="error-title">Something went wrong</h3>
                <p className="error-message">{error}</p>
                <button className="retry-btn" onClick={() => fetchIPData()}>
                    Try Again
                </button>
            </div>
        );
    }

    if (!ipData) return null;

    const { location, connection, time_zone, currency, security } = ipData;

    return (
        <>
            {/* Search Bar */}
            <div className="search-container">
                <form onSubmit={handleSearch}>
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            id="ip-search-input"
                            type="text"
                            className="search-input"
                            placeholder="Enter IP address to lookup (e.g. 1.1.1.1)"
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
                            Lookup
                        </button>
                    </div>
                </form>
                <button id="my-ip-btn" className="my-ip-btn" onClick={handleMyIP} aria-label="Detect my IP address">
                    📡 Detect My IP
                </button>
            </div>

            {/* IP Header Card */}
            <div className="ip-header-card animate-in">
                <div className="ip-main-info">
                    <span className="ip-flag">{location.country.flag.emoji}</span>
                    <div className="ip-details">
                        <h2>{ipData.ip}</h2>
                        <div className="ip-meta">
                            <span className="tag">{ipData.type}</span>
                            {ipData.hostname && (
                                <span>{ipData.hostname}</span>
                            )}
                            <button className="copy-btn" onClick={handleCopy} aria-label="Copy IP address to clipboard">
                                {copied ? "✓ Copied" : "📋 Copy"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="ip-location-text">
                    <div className="city">{location.city}</div>
                    <div>
                        {location.region.name}, {location.country.name}
                    </div>
                    <div>{location.continent.name}</div>
                </div>
            </div>

            {/* Map */}
            <div className="glass-card map-card animate-in">
                <div className="card-header">
                    <div className="card-icon location">📍</div>
                    <span className="card-title">Geolocation Map</span>
                </div>
                <MapView lat={location.latitude} lng={location.longitude} />
                <div className="map-coords">
                    <span>📐 Lat: {location.latitude.toFixed(4)}</span>
                    <span>📐 Lng: {location.longitude.toFixed(4)}</span>
                    {location.postal && <span>📮 Postal: {location.postal}</span>}
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="info-grid">
                {/* Location Card */}
                <div className="glass-card animate-in">
                    <div className="card-header">
                        <div className="card-icon location">🌍</div>
                        <span className="card-title">Location</span>
                    </div>
                    <div className="card-body">
                        <InfoRow label="Continent" value={`${location.continent.name} (${location.continent.code})`} />
                        <InfoRow label="Country" value={`${location.country.flag.emoji} ${location.country.name} (${location.country.code})`} />
                        <InfoRow label="Region" value={`${location.region.name} (${location.region.code})`} />
                        <InfoRow label="City" value={location.city} />
                        <InfoRow label="Postal Code" value={location.postal || "N/A"} />
                    </div>
                </div>

                {/* Network Card */}
                <div className="glass-card animate-in">
                    <div className="card-header">
                        <div className="card-icon network">🌐</div>
                        <span className="card-title">Network / ISP</span>
                    </div>
                    <div className="card-body">
                        <InfoRow label="ASN" value={`AS${connection.asn}`} />
                        <InfoRow label="Organization" value={connection.organization} />
                        <InfoRow label="Connection Type" value={connection.type} />
                        <InfoRow label="Hostname" value={ipData.hostname || "N/A"} />
                    </div>
                </div>

                {/* Timezone Card */}
                <div className="glass-card animate-in">
                    <div className="card-header">
                        <div className="card-icon time">🕐</div>
                        <span className="card-title">Timezone</span>
                    </div>
                    <div className="card-body">
                        <InfoRow label="Timezone" value={time_zone.id} />
                        <InfoRow label="Abbreviation" value={time_zone.abbreviation} />
                        <InfoRow label="UTC Offset" value={formatOffset(time_zone.offset)} />
                    </div>
                </div>

                {/* Currency Card */}
                {currency && (
                    <div className="glass-card animate-in">
                        <div className="card-header">
                            <div className="card-icon currency">💰</div>
                            <span className="card-title">Currency</span>
                        </div>
                        <div className="card-body">
                            <InfoRow label="Currency" value={currency.name} />
                            <InfoRow label="Code" value={currency.code} />
                            <InfoRow label="Symbol" value={currency.symbol} />
                        </div>
                    </div>
                )}
            </div>

            {/* Security Card */}
            <div className="glass-card animate-in">
                <div className="card-header">
                    <div className="card-icon security">🛡️</div>
                    <span className="card-title">Security Analysis</span>
                </div>
                <div className="security-grid">
                    <SecurityBadge label="VPN" detected={security.is_vpn} icon="🔒" />
                    <SecurityBadge label="Proxy" detected={security.is_proxy} icon="🔄" />
                    <SecurityBadge label="Tor Exit Node" detected={security.is_tor} icon="🧅" />
                    <SecurityBadge label="Known Threat" detected={security.is_threat} icon="⚠️" />
                </div>
            </div>
        </>
    );
}
