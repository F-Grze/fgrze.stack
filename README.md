# F-Grze の 涂鸦档案

一份基于开源博客模板 **[XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)** 的复刻站点。

版式、路由、交互全部沿用原作（首页卡片矩阵、搜索、文章/说说轮播、照片墙、归档时间轴、杂谈、友链、音乐播放器、3D 灵境页、手机端圆盘菜单…），视觉层面整体重做为**浅色纸感 + 墨色点缀**，并换上了五张涂鸦壁纸，每 5 秒轮播一张。

---

## 一、快速开始

```bash
pnpm install      # 或 npm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start   # 生产模式
```

Node 版本建议 ≥ 20（开发使用 22.13）。

## 二、这次改了什么

| 项目 | 原作 | 复刻版 |
| --- | --- | --- |
| 主题 | 深色玻璃 + 霓虹靛蓝 | 浅色纸感 + 墨色/黄铜点缀（暗色模式仍可切换） |
| 背景 | 3 张远程壁纸，10 秒切换 | **5 张本地壁纸，5 秒切换**，交叉淡入 + 缓慢推近 |
| 品牌 | XingHuiSama の 宝藏之地 | F-Grze の 涂鸦档案 |
| 图片 | 全部外链 CDN | 全部下载到 `public/` 并转 WebP（17MB → 4.1MB） |
| 内容 | 原作者个人文案 | 重写为本次复刻相关的文章 / 杂谈 / 说说 |
| 页面结构 | — | **完全保留**，未增删任何页面或区块 |

### 视觉改造的三个关键点

1. **色板映射**：在 `app/globals.css` 的 `@theme` 里重定义 `indigo / purple / pink` 三套色阶，全站的工具类颜色一次性跟着变；`html.dark` 里再还原原始霓虹色，两套主题都成立。
2. **表面处理**：半透明卡片统一提到 0.68 左右的白，白色描边换成 `rgba(16,16,22,0.10)` 的墨线，阴影收敛成纸片落影。
3. **壁纸降噪**：竖版插画铺 16:9 会切得很惨，所以给背景加 3px 柔焦 + 26% 米白压色 + 上下渐变收边，让画面成为「氛围」而不是「抢戏」。

## 三、目录结构

```
app/                 # App Router 页面
  page.tsx           # 首页（卡片矩阵）
  posts/[slug]       # 文章详情
  photowall/         # 照片墙
  timeline/          # 归档时间轴
  music/             # 音乐页
  tree/              # 灵境（3D / 炼金工房，原作暗色场景）
  moments/ chatter/ friends/ projects/ about/
app/api/             # 音乐、天气、Gitalk 代理、AI 猫（需要服务端）
components/          # 30+ 个交互组件
posts/ moments/ chatters/   # Markdown 内容
data/                # 相册、项目、友链、每日选刊
public/bg/           # 五张背景壁纸
public/media/        # 全站配图（WebP）
siteConfig.ts        # 全站配置中心：标题、头像、壁纸、社交、页脚
```

## 四、改成你自己的

- **站名 / 简介 / 头像 / 壁纸**：`siteConfig.ts`
- **换壁纸**：把图放进 `public/bg/`，改 `siteConfig.bgImages` 与 `bgGroups`（两张以上自动轮播，间隔在 `components/BackgroundSlider.tsx` 顶部的 `SLIDE_INTERVAL`）
- **写文章**：`posts/xxx.md`，frontmatter 支持 `title / date / description / cover / tags`
- **说说 / 杂谈**：`moments/`、`chatters/`
- **相册 / 项目 / 友链**：`data/albums.ts`、`data/projects.ts`、`data/friends.ts`
- **每日选刊**：`data/briefingConfig.json` 里 `display.enabled` 默认是 `false`（与原作一致），需要时打开并补 `data/dailyBriefingArchive.json`

## 五、部署

### 方案 A：Vercel（功能最完整，推荐）

```bash
npm i -g vercel && vercel
```

`app/api/*` 会作为 Serverless Function 运行，音乐播放器、天气、AI 猫、Gitalk 代理都可用。
需要配置的环境变量（可选）：`GEMINI_API_KEY`、`QWEATHER_KEY`。

### 方案 B：GitHub Pages（纯静态）

```bash
pnpm build:static          # 产物在 out/，会自动处理 API 路由与 next.config
./scripts/deploy-gh-pages.sh git@github.com:<你的用户名>/<仓库名>.git
```

然后在仓库 Settings → Pages 选择 `gh-pages` 分支。

**注意两点**：

- 静态模式下没有服务端，`/api/*` 不存在，音乐播放器会显示 "NO MUSIC AVAILABLE"，天气 / AI 猫 / 评论不可用；其余页面完全正常。
- 站点里用的是 `/bg/...`、`/media/...` 这类绝对路径，所以仓库要建成 `<用户名>.github.io`（根路径），或绑定自定义域名。放到子路径需要额外配置 `basePath` 并替换所有绝对路径。

## 六、版权

原模板为 **CC BY-NC 4.0**（署名—非商业性使用）。本复刻站点仅作学习与个人展示用途，请保留对原作者的署名，不要用于商业场景。壁纸与插画素材版权归各自作者所有。
