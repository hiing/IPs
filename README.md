<div align="center">

# 🌐 IP Insight

**高级 IP 地址智能分析平台**

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

一个基于 **React + Vite + Cloudflare Workers** 构建的现代化 IP 地址情报查询 Web 应用。  
拥有精美玻璃态 UI、交互式地图、完整安全威胁分析，并支持 **浅色 / 深色主题切换**。

[🔗 在线演示](https://ips.away.workers.dev) · [🐛 报告问题](https://github.com/hiing/IPs/issues) · [💡 功能建议](https://github.com/hiing/IPs/issues)

**🌏 [英文文档](./README.en.md)**

---

</div>

## 📋 目录

- [✨ 功能特性](#-功能特性)
- [🏗️ 技术栈](#️-技术栈)
- [📁 项目结构](#-项目结构)
- [🔧 本地开发](#-本地开发)
- [🚀 部署到 Cloudflare Workers](#-部署到-cloudflare-workers)
- [🔒 安全设计](#-安全设计)
- [📡 API 文档](#-api-文档)
- [📜 许可证](#-许可证)
- [🙏 致谢](#-致谢)

---

## ✨ 功能特性

<table>
<tr>
<td width="50%">

### 🌍 IP 地理定位
- 🔄 支持 **IPv4 / IPv6** 双栈查询
- 📡 自动检测访客 IP 地址
- 📍 精确到 **洲 → 国家 → 地区 → 城市 → 邮编**
- 🗺️ **Leaflet** 交互式地图展示，支持浅色 / 深色地图切换
- 📐 经纬度坐标实时显示

</td>
<td width="50%">

### 🔌 网络与连接
- 🏷️ ASN（自治系统号）查询
- 🏢 ISP / 组织名称识别
- 📶 连接类型判定（hosting / residential 等）
- 🔗 反向 DNS（Hostname）解析

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ 安全威胁分析
- 🔒 VPN 使用检测
- 🔄 代理服务器检测
- 🧅 Tor 出口节点检测
- ⚠️ 已知威胁 IP 实时标记
- 🟢🔴 直观的安全状态指示器

</td>
<td width="50%">

### 🎨 UI / UX 设计
- 🌗 精美 **Glassmorphism** 设计，支持浅色 / 深色主题
- ✨ 流畅入场动画 & 微交互效果
- 📱 完全响应式布局，移动端友好
- 🔤 Google Fonts **Inter** 字体
- 🎭 动态渐变背景光球

</td>
</tr>
<tr>
<td width="50%">

### 🕐 时区信息
- 🌐 时区 ID 与缩写
- ⏱️ UTC 偏移量精确计算

</td>
<td width="50%">

### 💰 货币信息
- 💱 所在国家对应的货币代码
- 📛 货币名称与符号展示

</td>
</tr>
</table>

---

## 🏗️ 技术栈

<div align="center">

| 🏷️ 类别 | 🛠️ 技术 | 📌 版本 |
|:---:|:---:|:---:|
| ⚛️ 前端框架 | React + TypeScript | 19.x |
| ⚡ 构建工具 | Vite + vinext | 7.x |
| 🗺️ 地图引擎 | Leaflet | 1.9.x |
| ☁️ 运行平台 | Cloudflare Workers | Edge |
| 📊 数据源 | [dklyIPdatabase](https://ipinfo.dkly.net) | REST API |
| 🎨 样式方案 | Vanilla CSS | 浅色 / 深色主题设计系统 |

</div>

---

## 📁 项目结构

```text
IPs/
├── 📂 app/
│   ├── 📂 api/
│   │   └── 📂 ipinfo/
│   │       └── 📄 route.ts           # 🔌 服务端 API（代理 + 限流 + 验证）
│   ├── 📂 components/
│   │   └── 📄 IPDashboard.tsx        # 📊 主仪表盘组件
│   ├── 🎨 globals.css                # 🎨 全局样式与主题设计系统
│   ├── 📄 layout.tsx                 # 📐 根布局（字体、Leaflet CSS）
│   ├── 📄 page.tsx                   # 🏠 首页
│   └── 🖼️ favicon.ico
├── 📄 worker-entry.js                # ☁️ Cloudflare Worker 入口
├── 📦 package.json
├── 📄 tsconfig.json
├── ⚡ vite.config.ts                 # Vite + vinext 配置
├── ☁️ wrangler.jsonc                 # Cloudflare Workers 配置
└── 📄 next.config.js
```

---

## 🔧 本地开发

### 📋 前置条件

| 工具 | 最低版本 | 说明 |
|:---:|:---:|:---:|
| ![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?style=flat-square&logo=node.js&logoColor=white) | 18+ | JavaScript 运行时 |
| ![npm](https://img.shields.io/badge/npm-≥9-CB3837?style=flat-square&logo=npm&logoColor=white) | 9+ | 包管理器 |
| 🔑 API Key | — | [免费注册](https://ipinfo.dkly.net/dashboard/register.php) |

### 📝 步骤

**1️⃣ 克隆项目**
```bash
git clone https://github.com/hiing/IPs.git
cd IPs
```

**2️⃣ 安装依赖**
```bash
npm install
```

**3️⃣ 配置环境变量**

创建 `.env.local` 文件：
```env
IPINFO_API_KEY=你的_API_Key
```

> [!WARNING]
> 🔐 请勿将 API Key 提交到版本控制中！

**4️⃣ 启动开发服务器**
```bash
npm run dev
```

**5️⃣ 打开浏览器**

访问 `http://localhost:3000` 🎉

---

## 🚀 部署到 Cloudflare Workers

### 📌 方式一：CLI 部署（推荐）

**1️⃣ 登录 Cloudflare**
```bash
npx wrangler login
```

**2️⃣ 设置 API Key Secret**
```bash
npx wrangler secret put IPINFO_API_KEY
# 在提示中输入你的 dklyIPdatabase API Key
```

**3️⃣ 构建并部署**
```bash
npx vinext build
npx wrangler deploy
```

> [!TIP]
> 🔁 后续更新只需重复第 3 步即可完成重新部署

### 📌 方式二：Cloudflare Dashboard

1. 🔑 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 📂 进入 **Workers & Pages** → **Create**
3. 🔗 连接你的 Git 仓库
4. ⚙️ 设置构建命令：

   | 配置项 | 值 |
   |:---:|:---:|
   | Build command | `npm run build` |
   | Build output | `dist` |

5. 🔐 在 **Settings → Environment Variables** 中添加 `IPINFO_API_KEY`
6. 🚀 触发部署

---

## 🔒 安全设计

| 🛡️ 安全措施 | 📝 说明 |
|:---:|:---|
| 🔐 **API Key 保护** | Key 仅存于服务端环境变量，前端完全不可见 |
| ⏱️ **速率限制** | 每 IP 每分钟最多 **30** 次请求，防止滥用 |
| ✅ **输入验证** | 严格的 IPv4/IPv6 正则格式校验，防止注入 |
| 💾 **响应缓存** | `Cache-Control` 策略降低上游 API 调用频率 |
| 🌐 **CORS 隔离** | 通过服务端代理转发，避免跨域暴露 API 凭证 |

---

## 📡 API 文档

### 🔀 请求流程

```text
🖥️ 客户端 → 📡 /api/ipinfo → 🔒 服务端（限流 + 验证） → 🌐 dklyIPdatabase API → 📦 返回结果
```

### 📥 请求示例

```bash
# 🔍 查询指定 IP
curl https://ips.away.workers.dev/api/ipinfo?ip=8.8.8.8

# 📡 查询访客自身 IP
curl https://ips.away.workers.dev/api/ipinfo
```

### 📤 响应示例

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

### 📊 状态码

| 状态码 | 🏷️ 含义 |
|:---:|:---|
| ✅ `200` | 请求成功 |
| ❌ `400` | IP 格式无效 |
| 🚫 `429` | 请求频率超限 |
| 💥 `500` | 服务端配置错误（如 API Key 缺失） |
| 🔌 `502` | 上游 API 无响应 |

---

## 📜 许可证

本项目基于 [MIT](LICENSE) 许可证开源 📄

---

## 🙏 致谢

<div align="center">

| 项目 | 说明 |
|:---:|:---:|
| 📊 [dklyIPdatabase](https://ipinfo.dkly.net) | IP 地理定位与安全分析数据 API |
| 🗺️ [Leaflet](https://leafletjs.com) | 开源轻量交互式地图库 |
| ⚡ [vinext](https://developers.cloudflare.com/workers/frameworks/vinext/) | Cloudflare 出品的 Vite + Next.js 框架 |
| ☁️ [Cloudflare Workers](https://workers.cloudflare.com) | 全球边缘计算运行平台 |
| ⚛️ [React](https://react.dev) | 用户界面组件库 |

</div>

---

<div align="center">

由 [hiing](https://github.com/hiing) 用 ❤️ 制作

</div>
