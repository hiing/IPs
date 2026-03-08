---
name: root-readme-documentation
description: Maintains the bilingual root README for IP Insight. Use when updating project overview, setup, deployment, security, or API docs in README.md and README.en.md.
---

## Bilingual README contract

README.en.md is a newly added full English counterpart to README.md, not a shortened summary.
Keep both files structurally aligned in this order: hero block, table of contents, features, tech stack, project structure, local development, deployment, security design, API documentation, license, acknowledgements.
Preserve the mixed HTML/Markdown style: centered <div> blocks, badge row, HTML <table> feature grid, emoji section headings, and reciprocal language links between README.md and README.en.md.

## Product summary

Project name: IP Insight.
The README describes it as an advanced IP intelligence lookup web app built with React + Vite + Cloudflare Workers.
Documented capabilities include IPv4/IPv6 lookup, visitor IP auto-detection, Leaflet map display, ASN/ISP/connection type lookup, reverse DNS, VPN/proxy/Tor/threat detection, time zone info, currency info, responsive glassmorphism UI, and light/dark theme switching.

## Documented stack and structure

Tech stack listed in the README: React 19.x, TypeScript 5.7, Vite 7 + vinext, Leaflet 1.9.x, Cloudflare Workers Edge, dklyIPdatabase REST API, Vanilla CSS.
Documented key files: app/api/ipinfo/route.ts, app/components/IPDashboard.tsx, app/globals.css, app/layout.tsx, app/page.tsx, worker-entry.js, vite.config.ts, wrangler.jsonc, next.config.js.

## Development and deployment documentation

Local development prerequisites: Node.js 18+, npm 9+, and IPINFO_API_KEY.
Documented local setup flow: git clone, npm install, create .env.local with IPINFO_API_KEY, run npm run dev, then open http://localhost:3000.
Documented Cloudflare CLI deployment flow: npx wrangler login, npx wrangler secret put IPINFO_API_KEY, npx vinext build, npx wrangler deploy.
Documented Cloudflare Dashboard deployment uses build command npm run build and build output dist.

## API and security details in README

Public endpoint documented in README: /api/ipinfo.
Request flow is documented as client -> /api/ipinfo -> server proxy with rate limiting and validation -> dklyIPdatabase API -> response.
Example requests cover explicit IP lookup and visitor IP lookup.
Documented response shape includes ip, type, hostname, connection, location, time_zone, currency, and security.
Documented status codes: 200 success, 400 invalid IP format, 429 rate limit exceeded, 500 server configuration error such as missing API key, 502 upstream API failure.
Documented security measures: server-only API key storage, 30 requests per minute per IP, strict IPv4/IPv6 regex validation, Cache-Control response caching, and CORS isolation through the server proxy.

## Related files

- `README.md`
- `README.en.md`
