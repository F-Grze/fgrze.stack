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

Root Directory 留空、Node 22、Install `corepack enable && pnpm install --frozen-lockfile`、Build `pnpm build`。
部署后 `https://<你的域名>/api/weather` 即可用。

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
| 网络定位显示当地天气 | `navigator.geolocation` → 服务端调高德逆地理编码（`geocode/regeo`）→ 取 adcode → 查天气；定位被拒时依次退回 IP 定位 → 默认城市 |
| 加载骨架屏 | 首屏渲染骨架块（当前天气卡 / 生活指数 / 预报列表三段式），不再是一块空白 |
| 错误兜底 | 网络失败 / 城市不存在 / 429 限流 / 配额耗尽 / Key 未配置，各自有独立中文提示与对应操作按钮 |
| 请求防抖 | 城市搜索 260ms、切换城市 350ms；同城市在途请求直接复用，不重复打 API |
| 本地缓存 | `localStorage` 缓存 8 分钟 + 服务端 TTL 缓存 8 分钟 + CDN `stale-while-revalidate` |
| 城市记忆 | `localStorage` 记住上次查询城市，下次进页自动加载 |
| 生活指数 | 穿衣 / 紫外线 / 洗车 / 运动 / 感冒 / 晨练 六项，按实况推算（`lib/life-index.ts`，前后端共用） |
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

## 三、性能与部署稳定性

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

## 四、中低优先级功能

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

## 五、环境变量

复制 `.env.example` 为 `.env.local` 后填写：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `AMAP_KEY` | ✅（用天气时） | 高德 Web 服务 Key，只在服务端读取 |
| `NEXT_PUBLIC_WEATHER_API_BASE` | ❌ | 静态托管时指向已部署的代理（Vercel / Worker），不填则自动降级 |
| `NEXT_PUBLIC_SITE_URL` | ❌ | 站点根地址，默认 `https://f-grze.github.io` |
| `NEXT_PUBLIC_BASE_PATH` | ❌ | 仓库子路径，由 `build-static.sh` 自动推断 |

---

## 六、常用命令与部署

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

> ⚠️ 上一轮使用的 fine-grained PAT 已失效（GitHub API 返回 401 Bad credentials），
> 需要重新生成一个带 **Contents: Read and write** 权限的 token。
> `main` 分支的 4 个提交已在本地准备好，token 一换即可推送。

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

## 七、文件清单

| 路径 | 说明 |
| --- | --- |
| `f-grze-blog/` | 完整源码（Next.js 16 + React 19 + Tailwind 4） |
| `f-grze-blog.zip` | 同上的压缩包（已排除 node_modules / .next / out） |
| `f-grze-blog/out/` | 已构建好的静态产物，`out/` 内是一个独立的 gh-pages git 仓库，可直接推送 |
| `preview/` | 上一轮导航栏改造的截图 |
| `preview-final/` | **本轮**交付截图（13 张，压缩到 2.1MB） |
| `preview2/` | 完整验收截图（27 张）+ Playwright 自动化验收脚本，可随时重跑 |

### 验收脚本（可重跑）

```bash
cd /workspace/preview2
python3 verify.py          # 全站多页多分辨率 + 横向溢出检测
python3 verify_post.py     # 文章页：进度条 / 目录锚点 / 代码复制 / 行宽 / 面包屑
python3 verify_degraded.py # 降级通道：拦截 /api/weather 验证自动切换
python3 verify_static.py   # 静态产物（GitHub Pages 本地模拟）验收
python3 final_verify.py    # 最终全量验收
```

**最近一次全量验收结果：13 项功能检查全绿，6 种分辨率 × 6 个页面横向溢出均为 0px，无致命 JS 错误。**

