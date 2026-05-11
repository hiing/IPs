"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, TileLayer, Marker } from "leaflet";

type Theme = "light" | "dark";

const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

interface MapViewProps {
    lat: number;
    lng: number;
    theme: Theme;
}

export default function MapView({ lat, lng, theme }: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<LeafletMap | null>(null);
    const tileLayerRef = useRef<TileLayer | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize map on mount or when lat/lng changes
    useEffect(() => {
        if (!mapRef.current || typeof window === "undefined") return;
        let isDisposed = false;

        const initMap = async () => {
            const L = (await import("leaflet")).default;
            if (isDisposed || !mapRef.current) return;

            // Fix default icon paths in bundled environments
            const proto = L.Icon.Default.prototype as typeof L.Icon.Default.prototype & { _getIconUrl?: string };
            delete proto._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const tileUrl = theme === "dark" ? DARK_TILE_URL : LIGHT_TILE_URL;

            const map = L.map(mapRef.current!, {
                zoomControl: true,
                attributionControl: false,
            }).setView([lat, lng], 12);

            const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
            const marker = L.marker([lat, lng]).addTo(map);

            mapInstanceRef.current = map;
            tileLayerRef.current = tileLayer;
            markerRef.current = marker;

            // Fix rendering in hidden containers; timer is cleaned up on unmount
            invalidateTimerRef.current = setTimeout(() => {
                if (!isDisposed) map.invalidateSize();
            }, 100);
        };

        initMap();

        return () => {
            isDisposed = true;
            if (invalidateTimerRef.current !== null) {
                clearTimeout(invalidateTimerRef.current);
                invalidateTimerRef.current = null;
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                tileLayerRef.current = null;
                markerRef.current = null;
            }
        };
    }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps

    // Hot-switch tile layer on theme change — no full map rebuild
    useEffect(() => {
        if (!tileLayerRef.current) return;
        const newUrl = theme === "dark" ? DARK_TILE_URL : LIGHT_TILE_URL;
        tileLayerRef.current.setUrl(newUrl);
    }, [theme]);

    return <div ref={mapRef} className="map-container" />;
}
