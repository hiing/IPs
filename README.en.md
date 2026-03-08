<div align="center">

# 🌐 IP Insight

**Advanced IP Intelligence Analysis Platform**

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

A modern IP intelligence lookup web app built with **React + Vite + Cloudflare Workers**.  
It features a polished glassmorphism UI, interactive maps, full security threat analysis, and **light / dark theme switching**.

[🔗 Live Demo](https://ips.away.workers.dev) · [🐛 Report Issues](https://github.com/hiing/IPs/issues) · [💡 Feature Requests](https://github.com/hiing/IPs/issues)

**🇨🇳 [Chinese Documentation](./README.md)**

---

</div>

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🔧 Local Development](#-local-development)
- [🚀 Deploy to Cloudflare Workers](#-deploy-to-cloudflare-workers)
- [🔒 Security Design](#-security-design)
- [📡 API Documentation](#-api-documentation)
- [📜 License](#-license)
- [🙏 Acknowledgements](#-acknowledgements)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🌍 IP Geolocation
- 🔄 Dual stack lookup for **IPv4 / IPv6**
- 📡 Automatic visitor IP detection
- 📍 Detailed location data from **continent → country → region → city → postal code**
- 🗺️ **Leaflet** interactive map with light / dark map switching
- 📐 Real time latitude and longitude display

</td>
<td width="50%">

### 🔌 Network and Connectivity
- 🏷️ ASN (Autonomous System Number) lookup
- 🏢 ISP / organization name identification
- 📶 Connection type detection, such as hosting / residential
- 🔗 Reverse DNS (hostname) resolution

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Security Threat Analysis
- 🔒 VPN usage detection
- 🔄 Proxy server detection
- 🧅 Tor exit node detection
- ⚠️ Real time known threat IP flagging
- 🟢🔴 Clear visual security status indicators

</td>
<td width="50%">

### 🎨 UI / UX Design
- 🌗 Polished **glassmorphism** design with light / dark theme support
- ✨ Smooth entrance animations and micro interactions
- 📱 Fully responsive layout, mobile friendly
- 🔤 Google Fonts **Inter** typography
- 🎭 Dynamic gradient background orbs

</td>
</tr>
<tr>
<td width="50%">

### 🕐 Time Zone Information
- 🌐 Time zone ID and abbreviation
- ⏱️ Accurate UTC offset calculation

</td>
<td width="50%">

### 💰 Currency Information
- 💱 Currency code for the detected country
- 📛 Currency name and symbol display

</td>
</tr>
</table>

---

## 🏗️ Tech Stack

<div align="center">

| 🏷️ Category | 🛠️ Technology | 📌 Version |
|:---:|:---:|:---:|
| ⚛️ Frontend Framework | React + TypeScript | 19.x |
| ⚡ Build Tool | Vite + vinext | 7.x |
| 🗺️ Map Engine | Leaflet | 1.9.x |
| ☁️ Runtime Platform | Cloudflare Workers | Edge |
| 📊 Data Source | [dklyIPdatabase](https://ipinfo.dkly.net) | REST API |
| 🎨 Styling | Vanilla CSS | Light / dark theme design system |

</div>

---

## 📁 Project Structure

```text
IPs/
├── 📂 app/
│   ├── 📂 api/
│   │   └── 📂 ipinfo/
│   │       └── 📄 route.ts           # 🔌 Server API, proxy + rate limit + validation
│   ├── 📂 components/
│   │   └── 📄 IPDashboard.tsx        # 📊 Main dashboard component
│   ├── 🎨 globals.css                # 🎨 Global styles and theme design system
│   ├── 📄 layout.tsx                 # 📐 Root layout, fonts and Leaflet CSS
│   ├── 📄 page.tsx                   # 🏠 Home page
│   └── 🖼️ favicon.ico
├── 📄 worker-entry.js                # ☁️ Cloudflare Worker entry
├── 📦 package.json
├── 📄 tsconfig.json
├── ⚡ vite.config.ts                 # Vite + vinext configuration
├── ☁️ wrangler.jsonc                 # Cloudflare Workers configuration
└── 📄 next.config.js
```

---

## 🔧 Local Development

### 📋 Prerequisites

| Tool | Minimum Version | Notes |
|:---:|:---:|:---:|
| ![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?style=flat-square&logo=node.js&logoColor=white) | 18+ | JavaScript runtime |
| ![npm](https://img.shields.io/badge/npm-≥9-CB3837?style=flat-square&logo=npm&logoColor=white) | 9+ | Package manager |
| 🔑 API Key | — | [Register for free](https://ipinfo.dkly.net/dashboard/register.php) |

### 📝 Steps

**1️⃣ Clone the repository**
```bash
git clone https://github.com/hiing/IPs.git
cd IPs
```

**2️⃣ Install dependencies**
```bash
npm install
```

**3️⃣ Configure environment variables**

Create a `.env.local` file:
```env
IPINFO_API_KEY=your_api_key
```

> [!WARNING]
> 🔐 Never commit your API key to version control.

**4️⃣ Start the development server**
```bash
npm run dev
```

**5️⃣ Open your browser**

Visit `http://localhost:3000` 🎉

---

## 🚀 Deploy to Cloudflare Workers

### 📌 Option 1: CLI deployment, recommended

**1️⃣ Log in to Cloudflare**
```bash
npx wrangler login
```

**2️⃣ Set the API key secret**
```bash
npx wrangler secret put IPINFO_API_KEY
# Enter your dklyIPdatabase API key when prompted
```

**3️⃣ Build and deploy**
```bash
npx vinext build
npx wrangler deploy
```

> [!TIP]
> 🔁 For later updates, repeat step 3 to redeploy.

### 📌 Option 2: Cloudflare Dashboard

1. 🔑 Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 📂 Go to **Workers & Pages** → **Create**
3. 🔗 Connect your Git repository
4. ⚙️ Set the build command:

   | Setting | Value |
   |:---:|:---:|
   | Build command | `npm run build` |
   | Build output | `dist` |

5. 🔐 Add `IPINFO_API_KEY` in **Settings → Environment Variables**
6. 🚀 Trigger the deployment

---

## 🔒 Security Design

| 🛡️ Security Measure | 📝 Description |
|:---:|:---|
| 🔐 **API key protection** | The key is stored only in server side environment variables and is never exposed to the frontend |
| ⏱️ **Rate limiting** | Up to **30** requests per minute for each IP, which helps prevent abuse |
| ✅ **Input validation** | Strict IPv4/IPv6 regex validation helps block malformed input and injection attempts |
| 💾 **Response caching** | `Cache-Control` reduces upstream API calls |
| 🌐 **CORS isolation** | Requests go through the server proxy, which avoids exposing API credentials across origins |

---

## 📡 API Documentation

### 🔀 Request Flow

```text
🖥️ Client → 📡 /api/ipinfo → 🔒 Server, rate limit + validation → 🌐 dklyIPdatabase API → 📦 Response
```

### 📥 Request Examples

```bash
# 🔍 Query a specific IP
curl https://ips.away.workers.dev/api/ipinfo?ip=8.8.8.8

# 📡 Query the visitor's own IP
curl https://ips.away.workers.dev/api/ipinfo
```

### 📤 Response Example

```json
{
  "ip": "8.8.8.8",
  "type": "IPv4",
  "hostname": "dns.google",
  "connection": {
    "asn": 15169,
    "organization": "Google LLC",
    "type": "hosting"
  },
  "location": {
    "continent": { "code": "NA", "name": "North America" },
    "country": { "code": "US", "name": "United States", "flag": { "emoji": "🇺🇸" } },
    "region": { "code": "CA", "name": "California" },
    "city": "Mountain View",
    "postal": "94043",
    "latitude": 37.4056,
    "longitude": -122.0775
  },
  "time_zone": {
    "id": "America/Los_Angeles",
    "abbreviation": "PST",
    "offset": -28800
  },
  "currency": {
    "code": "USD",
    "name": "United States Dollar",
    "symbol": "$"
  },
  "security": {
    "is_vpn": false,
    "is_proxy": false,
    "is_tor": false,
    "is_threat": false
  }
}
```

### 📊 Status Codes

| Status Code | 🏷️ Meaning |
|:---:|:---|
| ✅ `200` | Request succeeded |
| ❌ `400` | Invalid IP format |
| 🚫 `429` | Rate limit exceeded |
| 💥 `500` | Server configuration error, such as a missing API key |
| 🔌 `502` | Upstream API did not respond |

---

## 📜 License

This project is open source under the [MIT](LICENSE) License 📄

---

## 🙏 Acknowledgements

<div align="center">

| Project | Description |
|:---:|:---:|
| 📊 [dklyIPdatabase](https://ipinfo.dkly.net) | IP geolocation and security analysis data API |
| 🗺️ [Leaflet](https://leafletjs.com) | Open source lightweight interactive map library |
| ⚡ [vinext](https://developers.cloudflare.com/workers/frameworks/vinext/) | Vite + Next.js framework from Cloudflare |
| ☁️ [Cloudflare Workers](https://workers.cloudflare.com) | Global edge computing platform |
| ⚛️ [React](https://react.dev) | User interface component library |

</div>

---

<div align="center">

Made with ❤️ by [hiing](https://github.com/hiing)

</div>
