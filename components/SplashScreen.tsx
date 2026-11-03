"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../siteConfig';

/**
 * 启动屏（Loading Veil）
 *
 * 设计要点 —— **绝不依赖 JS 才能揭开**：
 *   1. 内容在 layout 中默认可见（opacity:1），启动屏只是覆盖在上面的动画层；
 *   2. 已看过启动屏的访客，由 head 里的内联脚本在首帧就加上 `.splash-skip`，
 *      遮罩不渲染，无感知跳过；
 *   3. 即使 hydration 失败（脚本加载被 CDN 限流 / 网络抖动），
 *      页面内容依然完整可读 —— 彻底消除「脚本挂掉 → 整站白屏」的历史问题。
 */
export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    let hasSeenSplash = false;
    try {
      hasSeenSplash = sessionStorage.getItem('hasSeenSplash') === 'true';
    } catch {
      /* ignore */
    }

    if (hasSeenSplash) {
      // 容错处理：确保直接访问时类名存在
      document.documentElement.classList.add('splash-skip');
      return;
    }

    setShow(true);
    try {
      sessionStorage.setItem('hasSeenSplash', 'true');
    } catch {
      /* ignore */
    }
    // 动画结束后卸载遮罩节点，避免残留在 DOM 里
    const timer = setTimeout(() => setShow(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  // SSR / hydration 之前不输出遮罩节点（此时内容默认可见，不会白屏）
  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash-screen-container"
          exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white dark:bg-slate-950"
        >
          <div className="relative z-10 flex flex-col items-center">
            {/* 头像光环 */}
            <div className="relative w-24 h-24 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-[3px]"
              />
              <div className="relative w-full h-full rounded-full p-1.5 bg-white dark:bg-slate-900 shadow-xl">
                <img src={siteConfig.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-[0.2em] uppercase">
              {siteConfig.authorName}
            </h1>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.5em] mb-12">INITIALIZING SYSTEM</p>

            <div className="w-40 h-[1.5px] bg-slate-200 dark:bg-slate-800 relative">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}