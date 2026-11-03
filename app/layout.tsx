import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import { MusicProvider } from "../components/MusicProvider";
import FloatingPlayer from "../components/FloatingPlayer";
import { siteConfig } from "../siteConfig";
import ClickEffect from "../components/ClickEffect";
import BackgroundSlider from "../components/BackgroundSlider";
import GlobalToolbox from "../components/GlobalToolbox";
import SplashScreen from "../components/SplashScreen";
import CyberCat from '../components/CyberCat';
import DanmakuBackground from '../components/DanmakuBackground';
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
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased`} suppressHydrationWarning>
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
            <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-1000">
              <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                {!siteConfig.useGradient && <BackgroundSlider />}
                <div className="site-veil absolute inset-0 z-[-9] transition-colors duration-1000"></div>

                {/* 渐变光晕：改用 transform 动画代替 background-position 动画。
                    background-position 每帧都要重绘整个全屏图层；transform 交给合成器，
                    主线程几乎零开销。同时去掉 mix-blend-color —— 它会让整屏参与混合计算，
                    是滚动掉帧的另一个大头。 */}
                <div className="absolute inset-0 z-[-8] overflow-hidden opacity-[0.10] dark:opacity-20 transition-opacity duration-1000 pointer-events-none">
                  <div
                    className="absolute -inset-[30%]"
                    style={{
                      backgroundImage: `linear-gradient(-45deg, ${siteConfig.themeColors.join(', ')})`,
                      backgroundSize: '200% 200%',
                      animation: 'gradientDrift 26s ease-in-out infinite alternate',
                      willChange: 'transform',
                    }}
                  ></div>
                </div>

                {/* 👇 🌟 优化：手机端去掉了 mix-blend-overlay，但保留了 blur 模糊光晕，确保视觉不打折 */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/40 dark:bg-indigo-900/20 blur-[100px] rounded-full z-[-7] md:mix-blend-overlay"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-purple-900/30 blur-[100px] rounded-full z-[-7] md:mix-blend-overlay"></div>

                {/* 隐藏手机端高负载粒子特效 */}
                <div className="hidden md:block absolute inset-0 w-full h-full">
                  <BackgroundEffects />
                </div>
              </div>

              {/* 隐藏手机端弹幕 */}
              <div className="hidden md:block">
                <DanmakuBackground />
              </div>

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