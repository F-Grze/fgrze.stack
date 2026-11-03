'use client';

import { useEffect } from 'react';

/**
 * 运行期性能护栏。
 *
 * 站点里有大量装饰性 CSS 动画（背景渐晕、天气场景、粒子、弹幕……）。
 * 标签页切到后台时，这些动画虽然会被浏览器降频，但 background-position、
 * backdrop-filter 这类动画仍会持续触发样式重算与重绘，切回来时还会因为
 * 积压的帧出现明显卡顿。
 *
 * 这里仅在 <html> 上打一个 data-tab-hidden 标记，由 CSS 统一
 * `animation-play-state: paused`，成本为零，也不需要改任何子组件。
 */
export default function PerfGuard() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      if (document.hidden) root.setAttribute('data-tab-hidden', 'true');
      else root.removeAttribute('data-tab-hidden');
    };

    sync();
    document.addEventListener('visibilitychange', sync, { passive: true });

    // bfcache 恢复时补一次同步（此时不会触发 visibilitychange）
    window.addEventListener('pageshow', sync, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pageshow', sync);
      root.removeAttribute('data-tab-hidden');
    };
  }, []);

  return null;
}
