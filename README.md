# Luminara 下载站

Luminara 的独立下载页：中文默认 `/`，英文 `/en/`。所有版本与文件均来自
[`CraftAmethyst/Luminara`](https://github.com/CraftAmethyst/Luminara) 的 GitHub
Releases，构建时生成快照并提交到仓库，浏览器运行时不请求 GitHub API。

每个可下载文件提供两个操作：

- **GitHub 下载**：release asset 直链。
- **国内加速**：把完整直链拼到第三方 GitHub 加速前缀后，可在
  `ghfast.top` / `gh-proxy.com` / `ghproxy.net` 之间切换。

## 技术栈

- Vue 3 + Vite + TypeScript
- Tailwind CSS v4（CSS-first theme）
- Vitest
- Cloudflare Pages

## 本地开发

```bash
npm ci
npm run dev
```

- 中文：<http://localhost:5173/>
- 英文：<http://localhost:5173/en/>
- FeudalKings 深链：`/?branch=feudalkings`（英文 `/en/?branch=feudalkings`）；
  切换语言时会保留该参数。

生产构建需要 `SITE_URL`（绝对 HTTPS 地址）。复制 `.env.example` 为
`.env.local` 并填写实际域名：

```bash
SITE_URL=https://lum-dl.rimecraft.top
```

```bash
npm run build     # 校验数据 → vue-tsc → vite build
npm run preview
```

PowerShell 不支持 `VAR=value npm run build` 前缀，请使用 `.env.local` 或先
`$env:SITE_URL = "https://..."`。

## 数据快照

`src/data/releases.json` 是提交到仓库的构建期快照。刷新：

```bash
npm run data:refresh
# 可选：设置 GITHUB_TOKEN 提高 API 限额
```

`GITHUB_TOKEN` 只会发送给 `api.github.com`，不会发送给加速代理或资产下载。

其他数据命令：

```bash
npm run validate:data   # 离线校验 schema、URL、排序、重复资产
npm run data:check      # 只检查是否会发生变化（有变化时退出 1）
npm run verify:links    # 网络请求：HEAD 校验所有 GitHub 直链
```

抓取规则摘要：

- 只接受 `Trials/*`、`FeudalKings/*`、`FK/*`，以及 `target_commitish` 为
  `stable/Trials` / `stable/FeudalKings` 的无前缀版本标签（例如
  `1.0.9.1-Fix`）。
- 只把 `.jar` 视为可下载 mod 资产；`.zip`、`.sha256`、`SHA256SUMS` 不生成下载按钮。
- 优先使用 GitHub API 的 `digest`；缺失时才读取 `.sha256` / `SHA256SUMS`。
- 版本排序使用数字段 + 发布时间兜底，不依赖严格 semver。
- 数据量异常下降或某个分支失去全部受支持资产时，脚本默认拒绝写入；
  确认无误可加 `--allow-regression`。

## 测试

```bash
npm run test          # Vitest
npm run typecheck     # vue-tsc --noEmit
npm run validate:data
```

测试覆盖标签解析、无前缀 fix 版本、ZIP-only 版本、Trials 上的 Fabric 资产、
版本排序、SHA256SUMS basename 匹配、代理 URL 拼接与 latest stable/prerelease
选择。

## 生成图片资源

favicon 与 1200×630 OG 图已提交到 `public/`。品牌素材变化后重新生成：

```bash
npm run assets:generate
```

脚本使用 `sharp`，输入为 `src/assets/brand/logo-rounded.png` 与
`src/assets/brand/banner.png`。

## 部署到 Cloudflare Pages

Pages 项目 `luminara-dl-site` 已连接 GitHub 仓库
`CraftAmethyst/luminara-dl-site` 的 `main` 分支，推送即触发构建。

- 项目名：`luminara-dl-site`
- 生产分支：`main`
- Build command：`npm ci && npm run build`
- Output directory：`dist`
- 环境变量：
  - `SITE_URL=https://lum-dl.rimecraft.top`
  - `NODE_VERSION=22`

### 自定义域名

在 Pages 项目 `luminara-dl-site` 中添加 `lum-dl.rimecraft.top`，并在
Cloudflare DNS 创建 CNAME：

- 名称：`lum-dl`
- 目标：`luminara-dl-site.pages.dev`
- 代理：已代理（橙色云）

等 SSL 生效后访问 `https://lum-dl.rimecraft.top`。构建环境中的 `SITE_URL`
已经指向该域名，不需要再改。

## 自动刷新版本数据

`.github/workflows/refresh-releases.yml` 每 6 小时运行一次，也支持手动
`workflow_dispatch`：

1. 用 `GITHUB_TOKEN` 抓取 Releases。
2. 只有 `src/data/releases.json` 真正变化时才提交（忽略 `generatedAt`）。
3. 推送触发 Cloudflare Pages Git 集成重新构建。

前提：本站已推送到 GitHub 仓库并启用 Actions。GitHub 会在仓库连续 60 天无活动后
暂停定时工作流，需要时在 Actions 页面手动启用或运行一次。

## 加速线路

定义在 `src/lib/downloads.ts`：

```ts
export const PROXIES = [
  { id: 'ghfast', label: 'ghfast.top', prefix: 'https://ghfast.top/' },
  { id: 'gh-proxy', label: 'gh-proxy.com', prefix: 'https://gh-proxy.com/' },
  { id: 'ghproxy', label: 'ghproxy.net', prefix: 'https://ghproxy.net/' },
]
```

选择保存在 `localStorage` 的 `luminara.download-proxy`，不可用时回退
`ghfast`。加速线路均为第三方服务，可能失效或篡改文件；页面始终展示
SHA-256 校验值，并保留 GitHub 直连作为主操作。

## 目录说明

- `src/data/releases.json`：构建期 Release 快照（提交）。
- `scripts/fetch-releases.mjs`：抓取与归一化。
- `scripts/lib/release-utils.mjs`：标签 / 版本 / 资产解析与校验。
- `scripts/lib/checksums.mjs`：校验文件解析。
- `src/lib/release-select.ts`：latest stable / prerelease 与资产选择。
- `src/components/`：页面组件。
- `build/seo-plugin.ts`：`SITE_URL` 替换、sitemap、robots。
- `public/_headers`：Cloudflare Pages 缓存与安全头。
