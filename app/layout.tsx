import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { MusicProvider } from "../components/MusicProvider";
import FloatingPlayer from "../components/FloatingPlayer";
import { siteConfig } from "../siteConfig";
import ClickEffect from "../components/ClickEffect";
import NightValley from "../components/NightValley";
import GlobalToolbox from "../components/GlobalToolbox";
import SplashScreen from "../components/SplashScreen";
import CyberCat from '../components/CyberCat';
import Analytics from '../components/Analytics';
import PerfGuard from '../components/PerfGuard';

import MobileBackButton from '../components/MobileBackButton';

// 字体一律 preload: false
// 中文字体被拆成大量 unicode-range 分片（每个 50-80KB），preload 会让浏览器
// 在首屏并发拉取多个分片，把连接占满，导致 async chunk 脚本被挤到队尾迟迟拿不到
// —— 极端情况下页面会长时间处于「脚本未就绪」状态。交给浏览器按需加载更稳。
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], preload: false });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], preload: false });

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  // 只保留 400 / 700 两个字重：Noto Serif SC 会按 unicode-range 拆成大量分片，
  // 每多一个字重就多出一整套分片文件，首屏并发请求数会成倍增长。
  weight: ["400", "700"],
  variable: "--font-serif",
  display: 'swap',
  preload: false,
});

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://f-grze.github.io').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.bio,
  icons: {
    icon: siteConfig.faviconUrl,
    apple: siteConfig.faviconUrl,
  },
  alternates: {
    canonical: `${SITE_URL}${BASE_PATH}/`,
    types: {
      'application/rss+xml': [{ url: `${SITE_URL}${BASE_PATH}/rss.xml`, title: `${siteConfig.title} · RSS` }],
    },
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.bio,
    url: `${SITE_URL}${BASE_PATH}/`,
    siteName: siteConfig.title,
    locale: 'zh_CN',
    type: 'website',
    images: [`${SITE_URL}${BASE_PATH}${siteConfig.defaultPostCover}`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`dark ${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* 渐进增强：内容默认可见，绝不依赖 JS 解封。
            早期版本用 `visibility:hidden` + JS 加 `.splash-seen` 解封，
            一旦脚本加载失败（网络受限 / CDN 抖动）整站会永久白屏。
            现在改为「默认可见 + CSS 淡入」，启动屏只是覆盖在上层的动画遮罩。 */}
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 1; visibility: visible; pointer-events: auto; }
              @media (prefers-reduced-motion: no-preference) {
                #app-mount-root { animation: app-reveal 0.7s ease-out both; }
              }
              @keyframes app-reveal {
                from { opacity: 0; transform: translateY(8px); }
                to   { opacity: 1; transform: none; }
              }
            `
          }}
        />
        {/* 首帧定色：默认夜色，只有访客主动选过「纸白」才回到浅色。
            写在 head 里同步执行，避免先白后黑的闪烁。 */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // 服务端已经把 dark 写在 html 上，这里只在访客主动选过「纸白」时摘掉
                var t = localStorage.getItem('blog-theme');
                if (t === 'light') document.documentElement.classList.remove('dark');
              } catch (e) {}
            `
          }}
        />
        {/* 已看过启动屏的访客直接跳过（类名由 SplashScreen 在 hydration 后添加） */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('hasSeenSplash') === 'true') {
                  document.documentElement.classList.add('splash-skip');
                }
              } catch (e) {}
            `
          }}
        />
      </head>

      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>

          <Analytics />

          <SplashScreen />

          <PerfGuard />

          <MusicProvider>
            {/* ⚠️ 背景层必须放在 #app-mount-root 之外。
                #app-mount-root 上有 app-reveal 动画，即使收尾帧写的是 transform:none，
                浏览器算出来的仍是单位矩阵 matrix(1,0,0,1,0,0) —— 而只要 transform 不是 none，
                它就会成为 position:fixed 后代的「包含块」。结果是下面这个 inset-0 的固定层
                被撑成整个文档高度（实测 1440×1984 而不是 1440×950），
                横版背景图被 object-cover 按高度放大 1.8 倍再裁切，
                看上去就成了「竖屏渲染 + 放大的局部」。 */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#05070a]">
              {siteConfig.useGradient ? (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(-45deg, ${siteConfig.themeColors.join(', ')})`,
                    backgroundSize: '200% 200%',
                    animation: 'gradientDrift 26s ease-in-out infinite alternate',
                  }}
                />
              ) : (
                <NightValley />
              )}

              {/* 夜色纱罩：只压暗、不上色，让花谷在内容之下仍然可辨 */}
              <div className="site-veil absolute inset-0 z-[-9] transition-colors duration-1000"></div>
            </div>

            <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-1000">
              <div className="relative z-10 flex-1 flex flex-col">
                {children}
              </div>

              <div className="hidden md:block">
                <FloatingPlayer />
              </div>

              <div className="hidden md:block">
                <GlobalToolbox />
              </div>

              <div className="md:hidden block">
                <MobileBackButton />
              </div>

              {/* 隐藏手机端点击粒子 */}
              <div className="hidden md:block">
                <ClickEffect />
              </div>
            </div>

            <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
              @keyframes gradientDrift {
                from { transform: translate3d(-5%, -3%, 0) rotate(0deg) scale(1.15); }
                to   { transform: translate3d(5%, 3%, 0) rotate(2.5deg) scale(1.28); }
              }
            `}} />
          </MusicProvider>

          {/* 猫娘是 fixed 定位的浮层，768–1023 这段宽度会压住正文卡片，
              因此只在 lg 以上显示。 */}
          <div className="hidden lg:block">
            <CyberCat />
          </div>

        </ThemeProvider>
      </body>
    </html>
  );
}