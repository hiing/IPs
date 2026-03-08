---
name: ip-dashboard-hong-kong-normalization
description: Normalizes inconsistent Hong Kong geolocation data in the IP dashboard before rendering country, region, and currency fields. Use when changing IP display logic or /api/ipinfo fetching behavior.
---

## Normalization purpose

IPDashboard contains client-side Hong Kong normalization to correct upstream responses that may label Hong Kong as China or use inconsistent HK naming. The normalized view affects displayed country flag/name/code, currency, and whether the region row is shown.

## Fetch contract

fetchIPData always sends /api/ipinfo with URLSearchParams.
It includes v=hk-normalize-v2 via API_NORMALIZATION_VERSION so cache keys change when normalization behavior changes.
Requests use cache: "no-store" to avoid stale normalized data.
If a searched IP exists, it is added as the ip query param.

## Hong Kong detection signals

isHongKongLocation combines multiple signals instead of trusting one field.
Accepted country codes: HK, HKG, CN-HK.
Accepted region code: HK.
Currency signal matches HKD, Hong Kong Dollar aliases, or symbols containing HK$.
Timezone signal matches Asia/Hong_Kong, HKT, or HKST.
Text signal checks country/region/city aliases plus district names in English and Chinese.
China-misclassified records are still treated as Hong Kong when China-like fields appear together with HK text/timezone signals.
Coordinate fallback uses a Hong Kong bounding box, but only counts when paired with HK text/timezone evidence.

## String canonicalization rules

canonicalizeHongKongString lowercases, trims, removes whitespace, strips hyphens/underscores, and removes non [a-z0-9\u4e00-\u9fa5$] characters.
Alias matching is exact against a canonicalized Set.
Known aliases include hong kong, hong kong sar, 香港特别行政区, 香港特別行政區, 中国香港, 中國香港, hksar, hk, hkt, hkst, hk dollar, hong kong dollar, hk$, hkg.

## District-based recovery

HONG_KONG_DISTRICT_KEYWORDS adds recovery for records that mention only districts instead of the country name.
Covered English examples include kowloon, quarry bay, causeway bay, wan chai, wong tai sin, tsim sha tsui, sha tin, tsuen wan, kwun tong, yuen long, tuen mun, tai po, sai kung, hong kong island, new territories, eastern district, southern district, north district, islands district, yau tsim mong.
Covered Chinese examples include 九龍, 新界, 灣仔, 黄大仙, 黃大仙, 沙田, 荃灣, 觀塘, 元朗, 屯門, 大埔, 西貢, 港島.

## Display override behavior

When shouldNormalizeHongKong is true, displayCountry is forced to { code: "HK", name: "Hong Kong", flagEmoji: "🇭🇰" }.
displayCurrency is forced to { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" }.
Region display uses hasDedicatedRegion: show the region only if it is non-empty, not an HK alias, and not equal to the normalized country name.
This avoids redundant output like 'Hong Kong, Hong Kong' while still preserving real districts/regions.

## Related files

- `app/components/IPDashboard.tsx`
