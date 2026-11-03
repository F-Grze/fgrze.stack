# 交付说明 · F-Grzeの光影日志

## 线上地址

| 渠道 | 地址 | 天气能力 |
| --- | --- | --- |
| GitHub Pages（纯静态） | **https://f-grze.github.io/fgrze.stack/** | 走 Open-Meteo 公开备用接口（自动降级） |
| Vercel（服务端部署） | 绑定自己的域名后可用 | 走高德天气 API（服务端代理，Key 不落前端） |

仓库：https://github.com/F-Grze/fgrze.stack
- `main` 分支 = 源码（Markdown / TS 数据 / 组件）
- `gh-pages` 分支 = 构建产物（GitHub Pages 从这里发布）

---

## 一、高德天气 API 接入（本轮核心）

### 安全模型

```
浏览器  ──►  /api/weather  ──►  高德 restapi.amap.com
           （服务端代理）        （Key 只在服务端）
```

- Key 存在服务端环境变量 **`AMAP_KEY`**，只出现在 Route Handler 里，**不会被打进任何前端产物**
- 前端能看到的只有一个「代理入口」地址，不含任何凭据
- 附带跨域响应头，静态托管也能安全调用（可指向 Vercel 或 Cloudflare Worker 的同一路径）

### 三种部署方式任选其一

**① Vercel（最省事，推荐）**

在 Vercel 项目 → Settings → Environment Variables 添加：

```
AMAP_KEY = 9d048022fa962f81a61c7975abea88d0
```

项目设置（**全部保持默认，不要覆写**）：

| 项 | 值 | 说明 |
| --- | --- | --- |
| Root Directory | **留空** | 填子目录会导致找不到 `package.json` |
| Framework Preset | Next.js（自动识别） | `vercel.json` 已声明 `framework: nextjs` |
| Build Command | `pnpm build` | 仓库已内置 |
| **Install Command** | **留空** | ⚠️ 详见下方说明，覆写反而会装错 pnpm 版本 |
| Node.js Version | 22 | `engines` 已声明 `>=20.9.0` |

> ⚠️ **Install Command 必须留空**。Vercel 会依据 `pnpm-lock.yaml` 自动识别包管理器并执行 `pnpm install`；
> 一旦你覆写 `installCommand`，Vercel 会改用**构建容器里最老的那个 pnpm（v6）**，读不了 `lockfileVersion: 9.0`。
> 早期版本里写的 `corepack enable && pnpm install --frozen-lockfile` 还会因为 npm 签名密钥轮换直接崩
> （`Cannot find matching keyid`），依赖装不上 → Next.js 检测不到 → 报「没有检测到 JS 版本」。

部署后 `https://<你的域名>/api/weather` 即可用。

**Vercel 部署报错速查**

| 报错 | 原因 | 处理 |
| --- | --- | --- |
| `无效的要求：不应该有其他属性 'installers'` | `vercel.json` 含非法字段（官方 schema 为 `additionalProperties: false`） | 已修复：移除 `installers` |
| `没有检测到 JS 版本 / 请确保您的包有 'next'` | 依赖没装上（Install Command 或 Root Directory 有误） | Install Command 留空 + Root Directory 留空 |
| `The Edge runtime is deprecated and cannot be used` | 路由声明了 `runtime = 'edge'` | 已修复：全部改为 `'nodejs'` |
| `ENOENT: readlink out/404.html` | `out/`（Pages 产物）被文件追踪收录又被 `.vercelignore` 排除 | 已修复：`outputFileTracingExcludes` + 部署前清理 `out/` |

**② Cloudflare Worker（静态托管专用，边缘更快）**
1. Workers & Pages → Create Worker → 粘贴 `workers/amap-weather.js` → Deploy
2. Settings → Variables and Secrets → 新增 **Secret**：`AMAP_KEY = <你的 Key>`（务必用 Secret）
3. 可选 Secret：`ALLOWED_ORIGIN = https://f-grze.github.io`
4. 静态构建时带上：
   ```bash
   NEXT_PUBLIC_WEATHER_API_BASE=https://<worker>.workers.dev/api/weather pnpm build:static
   ```

**③ 什么都不配（自动降级）**
静态托管下 `/api/weather` 不存在，天气页会自动切到公开的 Open-Meteo 接口，
**依然支持「定位我」显示当地实时天气**，并在界面上标注「已自动切换到公开备用接口」。

### 天气页功能清单

| 能力 | 实现 |
| --- | --- |
| 网络定位显示当地天气 | `navigator.geolocation` → 服务端调高德逆地理编码（`geocode/regeo`）→ 取 adcode → 查天气；失败时按「拒绝授权 / 超时 / 设备不可用 / 非 HTTPS」给出**不同**提示，再依次退回 IP 定位 → 记忆城市 → 默认城市 |
| 定位失败可解释 | 打开面板即显示具体原因（权限被拒 / 超时 / 非安全上下文），不再是静默失败 |
| IP 定位 | 服务端把**访客真实 IP**（`x-forwarded-for` 等）传给高德 `v3/ip`；缓存按 IP 分桶，响应强制 `private, no-store` |
| 新增地点 | 搜索框可搜**任意城市/区县**（服务端 `action=search` → 高德地理编码），一键「＋ 添加」进「我的地点」，存 `localStorage`，可单个删除 |
| 加载骨架屏 | 首屏渲染骨架块（当前天气卡 / 生活指数 / 趋势图三段式），不再是一块空白 |
| 错误兜底 | 网络失败 / 城市不存在 / 429 限流 / 配额耗尽 / Key 未配置，各自有独立中文提示与对应操作按钮 |
| 请求防抖 | 地点搜索 320ms、切换城市 320ms；同城市在途请求直接复用，不重复打 API |
| 本地缓存 | `localStorage` 缓存 8 分钟 + 服务端 TTL 缓存 8 分钟 + CDN `stale-while-revalidate` |
| 城市记忆 | `localStorage` 记住上次查询城市，下次进页自动加载 |
| 生活指数 | 穿衣 / 紫外线 / 洗车 / 运动 / 感冒 / 晨练 六项，按实况推算（`lib/life-index.ts`，前后端共用） |
| 温度趋势折线图 | 纯 SVG（零依赖，不加 JS 包），高低温双曲线 + 渐变面积 + 触摸/悬停查看单日详情 |
| 页头标识 | 左上角「气象站 / WEATHER STATION」大字标识 |
| 数据来源 | 页面底部标注数据来源、更新频率、缓存时长、最近更新时间与免责声明 |
| 天气动画 | 晴（光晕脉动）/ 多云（云层漂移）/ 雨（雨滴下落）/ 雪（雪花飘落）/ 雾，随天气切换；尊重 `prefers-reduced-motion` |
| 预报 | 高德 `extensions=all` 返回未来 4 天，含白天/夜间天气、风向风力、最高/最低温 |

### 相关文件

| 文件 | 作用 |
| --- | --- |
| `lib/amap.ts` | 高德 API 封装（服务端）：天气、逆地理、IP 定位、错误码 → 中文提示 |
| `lib/cities.ts` | 常用城市表（adcode + 经纬度），前后端共用 |
| `lib/life-index.ts` | 生活指数推算（纯函数），前后端共用 |
| `app/api/weather/route.ts` | **后端代理**：Key 不出服务端，带 TTL 缓存与 CORS |
| `app/weather/WeatherClient.tsx` | 天气页前端：定位 / 缓存 / 防抖 / 骨架 / 兜底 / 降级 |
| `workers/amap-weather.js` | Cloudflare Worker 版边缘代理（可选） |

---

## 二、博客基础体验

### 图片优化

- 全站改用 **Next.js `<Image>`**（`components/OptimizedImage.tsx`）：自动 avif/webp 协商、按 `sizes` 裁剪、懒加载、blur 占位
- 服务端部署开启 Next 图片优化（`next.config.ts`），静态导出自动降级为 `unoptimized`
- 照片墙 / 相册 / 文章封面 / 归档卡片全部接入，加载完成后淡入，消除 CLS

### 相册灯箱

- `components/Lightbox.tsx`：全屏预览、**左右箭头翻图**、键盘 `←` `→` `Esc`、移动端滑动切换、底部缩略图导航条、计数 `3 / 12`
- 相册新增分组筛选（全部 / 涂鸦 / 泰拉 / 记录 / 收藏）
- 新增 **《泰拉大陆纪行》**（12 张，含相机参数 EXIF：机身 / 镜头 / 焦距 / 光圈 / 快门 / ISO），悬停照片即可看到拍摄参数

### 响应式

| 位置 | 修复 |
| --- | --- |
| 仪表盘 | 改为 `flex-wrap` 流式布局，运行时长拆成「天数 / 小时 / 分钟」三枚可换行徽章，小屏不再溢出 |
| 文章正文 | 新增 `.article-body`，最大行宽 `42rem`（约 38–42 汉字一行）、行高 1.95，小屏自动收窄 |
| 全站 | 6 种分辨率（1920 / 1440 / 1280 / 1024 / 768 / 390）× 6 个页面实测横向溢出均为 **0px** |

---

## 三、【重要】线上白屏问题：定位与彻底修复

### 现象

GitHub Pages 上访问站点，页面**一片空白**，HTML 源码却完全正常。

### 根因（三层叠加）

1. **硬隐藏依赖 JS 解封**
   `app/layout.tsx` 里原本写着
   `#app-mount-root { opacity: 0; visibility: hidden; }`，
   再由 `SplashScreen` 在 hydration 完成后给 `<html>` 加 `.splash-seen` 才显示。
   —— 脚本一旦没执行，**内容永久不可见**，且没有任何降级路径。

2. **首屏并发请求把连接占满**
   首页会同时触发 5 张背景大图（270KB × 5）、3 个中文字体分片、多张文章封面。
   `loading="lazy"` 对 `position:absolute` 全屏背景图**无效**（浏览器认为它们全在视口内）。
   连接被占满后，`async` chunk 脚本一直排队拿不到响应 → React 永远无法 hydration。

3. **CDN 缓存与产物版本错配**
   GitHub Pages 的 CDN 会缓存 HTML 最多 10 分钟。缓存期内访客拿到的可能是上一版 HTML，
   而它引用的 chunk 文件名在新一版产物里已经变了 → 脚本全部 404。

### 修复

| 层 | 改动 | 文件 |
| --- | --- | --- |
| 兜底 | 内容**默认可见**（`opacity:1` + 纯 CSS 淡入 `app-reveal`），彻底不依赖 JS 解封 | `app/layout.tsx` |
| 兜底 | 启动屏改为 `.splash-skip` 跳过 + 2.4s 自动卸载，遮罩不再「扣住」内容 | `components/SplashScreen.tsx` |
| 减负 | 背景图**只渲染「当前 + 下一张」**，切换时才请求 | `components/BackgroundSlider.tsx` |
| 减负 | `next/font` 全部 `preload: false`；Noto Serif SC 字重 900/700 → 700 | `app/layout.tsx` |
| 减负 | 头像 / 文章封面 / 杂谈封面 / 相册封面全部 `loading="lazy"` | 多个组件 |
| 减负 | 背景图 WebP 重新压缩：1187KB → **743KB** | `public/bg/*.webp` |
| 提权 | 产物 HTML 中所有外链 `<script>` 加 `fetchpriority="high"`，preload 脚本由 `low` 提为 `high` | `scripts/rewrite-assets.mjs` |
| 兼容 | 部署时**保留上一版 `_next/static`**，让 CDN 缓存切换期内新旧 HTML 都能命中 chunk | `scripts/deploy-gh-pages.sh` |

**首屏 preload 数量：9 → 2**（仅背景首图 + 入口脚本）。

### 效果

| 场景 | 修复前 | 修复后 |
| --- | --- | --- |
| 正常网络 | 白屏（React 未 hydrate，内容被隐藏） | 内容可见 + 全部交互正常 |
| 弱网 / CDN 限流 | 白屏 | 内容可见可读，脚本就绪后交互自动补上 |
| **完全禁用 JS** | 白屏 | **内容完整可读**（468 字符，站点标题在位） |

> 验收脚本 `preview2/verify_nojs.py` 专门覆盖「禁用 JS」场景，
> 这是判断站点是否真正具备渐进增强能力的硬指标。

---

## 四、性能与部署稳定性

| 项 | 做法 |
| --- | --- |
| 文章 SSG | `generateStaticParams` 预渲染，产物里 `/posts/[slug]` 为静态 HTML |
| 天气 CSR | 页面本身静态预渲染，数据在客户端按需拉取（不拖慢首屏） |
| RSS | `/rss.xml`（RSS 2.0，含 category / pubDate / 内容摘要）+ `atom:link` 自引用 |
| Sitemap | `/sitemap.xml`，12 条主路由 + 优先级与更新频率 |
| SEO | `canonical` / `openGraph` / `twitter` / `rss` alternate 全部按 `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_BASE_PATH` 自动拼接 |
| 基础监控 | `app/api/track`：页面访问量按路径聚合 + 天气接口失败率；`/api/track?stats=1` 查看；**只记录路径与事件类型，不采集 IP / UA 原文 / Cookie** |
| 状态页可视化 | 新增「访问」面板：总事件 / 访问页面数 / 天气失败数 / 运行时长 + 页面访问 Top 8 横向条形图 + 失败率进度条 |
| 首页体积 | 搜索框只接收文章元信息，markdown 正文不再打进 RSC payload |
| 代码块 | `components/CodeCopyButtons.tsx` 自动包裹 `<pre>` 并注入「复制」按钮（点击写入剪贴板，失败时降级 `execCommand`） |
| 追踪警告 | `app/about`、`app/status` 的动态路径读取加 `turbopackIgnore`，避免整个项目被无谓打包 |

---

## 五、中低优先级功能

| 功能 | 位置 |
| --- | --- |
| 文章分类 | frontmatter `category`（技术 / 设计 / …），归档页新增「全部分类」筛选条 |
| 文章标签筛选 | 归档页标签筛选 + 文章页标签可点击跳到 `/timeline?tag=xxx` |
| 目录锚点 | 右侧悬浮目录（ClientTOC），滚动高亮 + 平滑跳转（已有，本轮验证通过） |
| 阅读进度条 | 顶部 3px 渐变进度条 + 右下角百分比角标，文章页常驻 |
| 面包屑 | 文章页「首页 / 归档 / 技术 / 文章标题」 |
| 文章页导航 | `/posts/*` 路由下导航栏常驻，长文阅读时随时可跳转 |
| 站内搜索 | 首页搜索框同时搜文章与**相册**（相册结果带封面缩略图） |
| 页面转场 | `components/PageTransition.tsx`（已有） |
| 深浅主题 | `ThemeProvider` 用 `localStorage` 持久化（已有，本轮加深夜空主题动画降级） |
| 低端机保护 | 深色模式降低背景动画时长；`prefers-reduced-motion` 下关闭全站动效 |
| 新增文章 | 《把反应堆和分子塞进图里：一次分子模拟与图神经网络的联调》——含 4 段 Python 代码（消息传递 / 邻居列表 / 损失函数 / 轨迹对比），用来验证代码高亮 + 复制按钮 |

---

## 六、环境变量

复制 `.env.example` 为 `.env.local` 后填写：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `AMAP_KEY` | ✅（用天气时） | 高德 Web 服务 Key，只在服务端读取 |
| `NEXT_PUBLIC_WEATHER_API_BASE` | ❌ | 静态托管时指向已部署的代理（Vercel / Worker），不填则自动降级 |
| `NEXT_PUBLIC_SITE_URL` | ❌ | 站点根地址，默认 `https://f-grze.github.io` |
| `NEXT_PUBLIC_BASE_PATH` | ❌ | 仓库子路径，由 `build-static.sh` 自动推断 |

---

## 七、常用命令与部署

```bash
pnpm dev                 # 本地开发
pnpm build               # 服务端构建（Vercel 用）
pnpm start               # 启动生产服务
pnpm build:static        # 静态导出（GitHub Pages 用，自动推断 basePath）
pnpm typecheck           # 类型检查（当前零报错）
```

### 部署到 GitHub Pages

`scripts/deploy-gh-pages.sh` 已封装「构建 → 提交 → 推 gh-pages」全流程，**一条命令搞定**：

```bash
cd /workspace/f-grze-blog
GITHUB_TOKEN=<你的新 token> pnpm deploy:pages
```

> ✅ 已用新 token 完成推送：`main`（源码）与 `gh-pages`（产物）均已同步到线上。
> token 需带 **Contents: Read and write** 权限；若报 401，换一个 fine-grained PAT 即可。

> 💡 **部署后请等待 1–3 分钟**再访问：GitHub Pages 需要重建，CDN 也要同步新产物。
> 期间若偶发旧资源 404，属于缓存过渡期，刷新一次即可（部署脚本已保留历史静态资源兜底）。

### 部署到 Vercel

1. Vercel 导入仓库 `F-Grze/fgrze.stack`，分支 `main`
2. Root Directory 留空、Node 22
3. Install Command：`corepack enable && pnpm install --frozen-lockfile`
4. Build Command：`pnpm build`
5. Environment Variables 添加 `AMAP_KEY = 9d048022fa962f81a61c7975abea88d0`

### 静态托管下想走高德（而不是备用接口）

```bash
GITHUB_TOKEN=<token> \
NEXT_PUBLIC_WEATHER_API_BASE=https://<你的 Vercel 域名>/api/weather \
pnpm deploy:pages
```

---

## 八、文件清单

| 路径 | 说明 |
| --- | --- |
| `f-grze-blog/` | 完整源码（Next.js 16 + React 19 + Tailwind 4） |
| `f-grze-blog.zip` | 同上的压缩包（已排除 node_modules / .next / out） |
| `f-grze-blog/out/` | 已构建好的静态产物，`out/` 内是一个独立的 gh-pages git 仓库，可直接推送 |
| `preview/` | 上一轮导航栏改造的截图 |
| `preview-final/` | **本轮**交付截图（21 张，已压缩为 JPG） |
| `preview2/` | 完整验收截图（27 张）+ Playwright 自动化验收脚本，可随时重跑 |

### 验收脚本（可重跑）

```bash
cd /workspace/preview2
python3 verify.py          # 全站多页多分辨率 + 横向溢出检测
python3 verify_post.py     # 文章页：进度条 / 目录锚点 / 代码复制 / 行宽 / 面包屑
python3 verify_degraded.py # 降级通道：拦截 /api/weather 验证自动切换
python3 verify_static.py   # 静态产物（GitHub Pages 本地模拟）验收
python3 final_verify.py    # 最终全量验收
python3 verify_nojs.py [BASE]  # 【白屏回归】含「禁用 JS 内容仍可读」硬指标
python3 verify_live.py  [BASE]  # 线上/本地全功能验收（21 项）
```

**最近一次全量验收结果：**
- `verify_live.py`：**21 项功能检查全绿**（天气页 6 项 / 首页 4 项 / 相册 3 项 / 文章页 4 项 / 状态页 1 项 / RSS 1 项 / 移动端 1 项），无 JS 运行时错误
- `verify_nojs.py`：**9 项全绿**，其中「禁用 JS 后首页 / 天气页内容仍完整可见可读」是本轮重点
- 6 种分辨率 × 6 个页面横向溢出均为 **0px**

---

## 九、本轮改版：性能治理 + 天气页重构

### 1. 卡顿根因与修复

卡顿不是单一原因，而是几处「每帧都在白烧算力」的写法叠在一起：

| 问题 | 位置 | 为什么卡 | 处理 |
| --- | --- | --- | --- |
| `will-change: backdrop-filter` 全量下发（且重复声明两次） | `globals.css` | 每张玻璃卡片常驻独立合成层，背景一动，十几层每帧重新模糊 | 整段删除，交回浏览器按需提升 |
| 全屏渐变用 `background-position` 动画 + `mix-blend-color` | `layout.tsx` | `background-position` 每帧重绘整屏；混合模式让全屏参与混合运算 | 改为 `transform` 位移（合成器完成），去掉混合模式 |
| 点击涟漪 `requestAnimationFrame` 无条件自循环 | `ClickEffect.tsx` | 没有任何涟漪时仍每帧 `clearRect` 全屏 canvas，且带 `shadowBlur` | 有涟漪才启动，清空即停；隐藏标签页停止 |
| 导航栏滚动处理写入 state 并进依赖数组 | `Navbar.tsx` | 每次滚动都「卸载+重装监听器」并触发 React 重渲染 | 改 `ref` + `requestAnimationFrame` 节流 + 8px 抖动过滤 |
| 萤火虫 + 樱花**同时挂载**，靠 `opacity:0` 隐藏 | `BackgroundEffects.tsx` | `opacity:0` 不会让 CSS 动画停下，等于白跑 90 个动画 | 按主题只渲染一组 |
| 装饰元素数量过多 | `WindyGrass` / `Fireflies` / `Sakura` / `DanmakuBackground` | 草 150 + 萤火 50 + 樱花 40 + 弹幕 15，合计 300+ 常驻动画 | 72 / 20 / 16 / 10 |
| 弹幕动画 `right` 属性 | `DanmakuBackground.tsx` | 布局属性动画每帧触发 layout | 改为纯 `transform: translateX` |
| 毛玻璃卡片过多、半径 24px | 天气页 | 小卡片也在做全层模糊 | 新增 `.wx-card`（桌面 10px）/`.wx-card-flat`（无模糊），移动端直接关闭 `backdrop-filter` |

实测：**CSS 常驻动画 313 → 106（-66%）**，桌面毛玻璃层 **17 → 11**，`will-change: backdrop-filter` 归零，滚动期间**长任务 0 个**（>50ms 的主线程阻塞为 0），控制台 0 报错。

另外新增 `components/PerfGuard.tsx`：标签页不可见时给 `<html>` 打 `data-tab-hidden`，CSS 统一 `animation-play-state: paused`，切回来不再掉帧。

### 2. 背景图朝向

5 张素材原始文件是「竖版画布 + 侧躺的横屏内容」。用 EXIF 方向校正 + 旋转后重新编码为 **1920×1080 横版**（质量 78，合计 828KB），CSS 侧不再需要任何旋转 hack，`object-cover` 直接铺满。

> 备注：按内容正确朝向验证过两个方向，顺时针 90° 会让人物倒立，因此实际采用的是「使画面正立」的旋转方向。

### 3. 天气页新增

- **左上角「气象站」**：68px 大字 + `WEATHER STATION` 字距副标 + 三段渐弱装饰线
- **温度趋势折线图**：`components/WeatherTrendChart.tsx`，纯 SVG + Catmull-Rom 平滑，无第三方图表库（省 80–150KB JS）；支持悬停/触摸查看单日详情
- **数据来源标注**：底部固定区块，含数据源链接、更新频率、缓存时长、最近更新时间、免责声明
- **新增地点**：搜索任意城市/区县 → 加入「我的地点」→ 可删除，全部存本地

### 4. 定位与接口修复

| 问题 | 原因 | 修复 |
| --- | --- | --- |
| 永远定位失败 | 服务端调高德 IP 定位时没传 ip，高德用的是**服务器出口 IP**（机房 IP） | 从 `x-forwarded-for` / `x-real-ip` / `cf-connecting-ip` 取访客真实 IP 传入 |
| 定位结果串号 | 服务端用固定 key `ip:me` 缓存，第一个访客的结果会发给所有人 | 缓存按 `ip:<addr>` 分桶 |
| 定位结果被 CDN 缓存 | 默认响应头是 `public, s-maxage=480` | IP 定位响应强制 `private, no-store` |
| 控制台 `404` 报错 | 「查不到」返回 404，被浏览器/监控记为资源失败 | 改为 `200 + ok:false`（业务空结果） |
| 无法新增地点 | 只能从 72 个内置城市里选 | 新增 `action=search`，走高德地理编码，任意城市/区县可搜可加 |
| 定位原因不透明 | 统一吞掉成「定位失败」 | 区分拒绝授权 / 超时 / 设备不可用 / 非 HTTPS，逐条给出可操作提示 |


