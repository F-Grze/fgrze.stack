'use client';

import { useEffect, useState } from 'react';

/**
 * 阅读进度条
 * 固定在页面顶部，按 #article-content 的滚动位置计算百分比。
 * 用 requestAnimationFrame 节流，避免滚动时频繁 setState。
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let ticking = false;

    const compute = () => {
      const el = document.getElementById('article-content');
      if (!el) {
        setProgress(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setProgress(rect.top <= 0 ? 100 : 0);
        return;
      }
      const passed = Math.min(Math.max(-rect.top, 0), total);
      setProgress((passed / total) * 100);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(() => {
        compute();
        ticking = false;
      });
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (progress <= 0) return null;

  return (
    <>
      <div
        className="reading-progress"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-label="阅读进度"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      {/* 右下角小圆点百分比 */}
      <div className="fixed bottom-6 right-6 z-[60] hidden h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/70 text-[11px] font-black tabular-nums text-[#8A4A28] shadow-lg backdrop-blur-md transition-opacity md:flex dark:border-white/10 dark:bg-slate-800/70 dark:text-amber-200">
        {Math.round(progress)}%
      </div>
    </>
  );
}
