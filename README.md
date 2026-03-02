# IP Insight — IP Geolocation & Security Analysis

一个基于 **React + Vite + Cloudflare Workers** 构建的高级 IP 地址信息查询 Web 应用，拥有精美暗色主题 UI 和交互式地图。

> **在线演示**: 部署至 Cloudflare Workers 后即可使用

---

## ✨ 功能特性

### 🌍 IP 地理定位
- 支持 **IPv4 / IPv6** 地址查询
- 自动检测访客 IP 地址（Origin IP Lookup）
- 精确到 **洲、国家、地区、城市、邮编**
- 经纬度坐标及 **Leaflet 交互式地图** 展示

### 🔌 网络与连接信息
- ASN（自治系统号）
- ISP / 组织名称
- 连接类型（hosting / residential 等）
- 反向 DNS（Hostname）

### 🕐 时区与货币
- 时区 ID、缩写、UTC 偏移量
- 所在国家/地区对应的货币代码、名称、符号

### 🛡️ 安全威胁检测
- VPN 检测
- 代理服务器检测
- Tor 出口节点检测
- 已知威胁 IP 标记

### 🎨 UI/UX 设计
- 精美暗色玻璃态（Glassmorphism）设计系统
- 流畅的入场动画和微交互
- 响应式布局，移动端友好
- 自定义字体（Inter from Google Fonts）

---

## 🏗️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 + vinext |
| 地图 | Leaflet 1.9 |
| 运行平台 | Cloudflare Workers |
| 数据 API | [dklyIPdatabase](https://ipinfo.dkly.net) |
| 样式 | Vanilla CSS（暗色主题设计系统） |

---

## 📁 项目结构

```
IPs/
├── app/
│   ├── api/
│   │   └── ipinfo/
│   │       └── route.ts        # 服务端 API 路由（代理 + 限流）
│   ├── components/
│   │   └── IPDashboard.tsx     # 主仪表盘组件
│   ├── globals.css             # 全局样式 & 设计系统
│   ├── layout.tsx              # 根布局（字体、Leaflet CSS）
│   ├── page.tsx                # 首页
│   └── favicon.ico
├── .env.local                  # 环境变量（API Key）
├── package.json
├── tsconfig.json
├── vite.config.ts              # Vite + vinext 配置
├── wrangler.jsonc              # Cloudflare Workers 配置
└── next.config.js
```

---

## 🔧 本地开发

### 前置条件

- **Node.js** ≥ 18
- **npm** ≥ 9
- [dklyIPdatabase API Key](https://ipinfo.dkly.net/dashboard/register.php)（免费注册）

### 步骤

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd IPs
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**

   创建 `.env.local` 文件：
   ```env
   IPINFO_API_KEY=你的_API_Key
   ```
   > ⚠️ 请勿将 API Key 提交到版本控制中

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. 在浏览器中访问 `http://localhost:3000`

---

## 🚀 部署到 Cloudflare Workers

### 方式一：CLI 部署

1. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **设置 API Key Secret**
   ```bash
   wrangler secret put IPINFO_API_KEY
   ```
   在提示中输入你的 dklyIPdatabase API Key。

4. **部署**
   ```bash
   npm run deploy
   ```

### 方式二：Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **Create**
3. 连接你的 Git 仓库
4. 设置构建命令：
   - **Build command**: `npm run build`
   - **Build output directory**: `.vinext/output`
5. 在 **Settings → Environment Variables** 中添加：
   - `IPINFO_API_KEY` = `你的API密钥`
6. 触发部署

---

## 🔒 安全设计

| 安全措施 | 说明 |
|---------|------|
| **API Key 保护** | Key 仅存于服务端，前端不可见 |
| **速率限制** | 每 IP 每分钟最多 30 次请求 |
| **输入验证** | 严格的 IPv4/IPv6 格式校验 |
| **响应缓存** | `Cache-Control` 降低 API 调用频率 |
| **CORS 隔离** | 通过服务端代理避免跨域暴露 |

---

## 📡 API 路由说明

服务端 API 路由 `/api/ipinfo` 作为中间代理层：

```
客户端 → /api/ipinfo?ip=8.8.8.8 → 服务端（限流+验证） → dklyIPdatabase API → 返回结果
```

**请求示例：**
```bash
# 查询指定 IP
curl http://localhost:3000/api/ipinfo?ip=8.8.8.8

# 查询访客自身 IP
curl http://localhost:3000/api/ipinfo
```

**响应示例：**
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
  "security": {
    "is_vpn": false,
    "is_proxy": false,
    "is_tor": false,
    "is_threat": false
  }
}
```

---

## 📜 许可证

本项目使用 [MIT](LICENSE) 许可证。

---

## 🙏 致谢

- [dklyIPdatabase](https://ipinfo.dkly.net) — IP 地理定位数据 API
- [Leaflet](https://leafletjs.com) — 开源交互式地图库
- [vinext](https://github.com/nicepkg/vinext) — Vite + Next.js 风格的全栈框架
- [Cloudflare Workers](https://workers.cloudflare.com) — 边缘计算运行时
