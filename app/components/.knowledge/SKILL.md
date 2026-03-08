---
name: ip-dashboard-location-normalization
description: Normalizes IP location metadata before rendering dashboard cards. Use when changing country, region, or currency display logic in the IP dashboard.
---

## Hong Kong normalization rules

IPDashboard derives display values from raw API data before rendering.
Hong Kong is detected when any of these match: country.code === "HK", region.code === "HK", currency.code === "HKD", country/region name matches /hong kong/i or /香港/u, or time_zone.id === "Asia/Hong_Kong".
Helper functions: HONG_KONG_KEYWORDS, isHongKongValue(), isHongKongLocation().

## Derived display model

When shouldNormalizeHongKong is true, displayCountry is forced to { code: "HK", name: "Hong Kong", flagEmoji: "🇭🇰" }.
When shouldNormalizeHongKong is true, displayCurrency is forced to { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" }.
Otherwise displayCountry/displayCurrency fall back to location.country and currency from the API response.

## Region rendering behavior

hasDedicatedRegion is true only when location.region.name exists, is not a Hong Kong alias during normalization, and is not equal to displayCountry.name after trim().toLowerCase().
Header location line shows "region, country" only when hasDedicatedRegion is true; otherwise it shows country only.
Location card shows region as t(locale, "na") when hasDedicatedRegion is false to avoid duplicated Hong Kong country/region labels.

## UI fields that must use normalized values

Use displayCountry.flagEmoji in the header flag.
Use displayCountry.name/code in the location summary and country InfoRow.
Use displayCurrency.name/code/symbol in the currency card.
Do not read raw location.country or currency directly in rendered location/currency UI once normalization is applied.

## Related files

- `app/components/IPDashboard.tsx`
