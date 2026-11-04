"use client";

import { ReactNode } from "react";

/**
 * 页面入场动效。
 *
 * 这里刻意不用 framer-motion 的 initial/animate：那会在 SSR 输出里写死
 * `opacity: 0`，脚本一旦没跑到（弱网、CDN 抖动、禁用 JS），整页内容就是空的
 * —— 导航还在、正文不见，比不做动画糟糕得多。
 *
 * 改成纯 CSS 动画：首帧 HTML 里内容就是可见的，动画只是「锦上添花」，
 * 并且天然尊重 prefers-reduced-motion。
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
