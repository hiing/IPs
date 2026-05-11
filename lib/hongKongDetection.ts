// Shared Hong Kong detection utilities used by both server (route.ts) and client (IPDashboard.tsx)
// Single source of truth — eliminates the duplication between the two.

export const HONG_KONG_DISTRICT_PATTERNS: RegExp[] = [
    /kowloon/i, /quarry bay/i, /causeway bay/i, /wan chai/i,
    /wong tai sin/i, /tsim sha tsui/i, /sha tin/i, /tsuen wan/i,
    /kwun tong/i, /yuen long/i, /tuen mun/i, /tai po/i, /sai kung/i,
    /hong kong island/i, /new territories/i, /eastern district/i,
    /southern district/i, /north district/i, /islands district/i,
    /yau tsim mong/i,
    /九龍/u, /新界/u, /灣仔/u, /黄大仙/u, /黃大仙/u, /沙田/u,
    /荃灣/u, /觀塘/u, /元朗/u, /屯門/u, /大埔/u, /西貢/u, /港島/u,
];

export const HONG_KONG_TEXT_PATTERNS: RegExp[] = [/hong\s*kong/i, /香港/u];

export const CHINA_TEXT_PATTERNS: RegExp[] = [/china/i, /中国/u, /中國/u];

export const HONG_KONG_CODE_SET: Set<string> = new Set(["HK", "HKG", "CN-HK"]);

export const HONG_KONG_TIME_ZONE_SET: Set<string> = new Set(["ASIA/HONG_KONG"]);

export const HONG_KONG_TIME_ZONE_ABBREVIATION_SET: Set<string> = new Set(["HKT", "HKST"]);

export function canonicalizeHongKongString(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "")
        .replace(/[-_]/g, "")
        .replace(/[^a-z0-9\u4e00-\u9fa5$]/g, "");
}

const HK_ALIAS_RAW: string[] = [
    "hong kong", "hong kong sar", "香港特别行政区", "香港特別行政區",
    "中国香港", "中國香港", "hksar", "hk", "hkt", "hkst",
    "hk dollar", "hong kong dollar", "hk$", "hkg",
];
const HK_CANONICALS: Set<string> = new Set(HK_ALIAS_RAW.map((s) => canonicalizeHongKongString(s)));

export function isHongKongValue(value: string | undefined): boolean {
    const v = value ?? "";
    const canon = canonicalizeHongKongString(v);
    return HK_CANONICALS.has(canon);
}

export function isHongKongDistrict(value: string | undefined): boolean {
    return value ? HONG_KONG_DISTRICT_PATTERNS.some((pattern) => pattern.test(value)) : false;
}

export function isChinaValue(value: string | undefined): boolean {
    return value ? CHINA_TEXT_PATTERNS.some((pattern) => pattern.test(value)) : false;
}

export function isHongKongCoordinate(latitude: number | undefined, longitude: number | undefined): boolean {
    if (latitude === undefined || longitude === undefined) return false;
    return latitude >= 22.15 && latitude <= 22.6 && longitude >= 113.8 && longitude <= 114.5;
}

export function matchesAnyPattern(value: string | undefined, patterns: RegExp[]): boolean {
    return value ? patterns.some((pattern) => pattern.test(value)) : false;
}
