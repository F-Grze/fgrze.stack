'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 极简访问埋点
 *
 * - 路由变化上报一次 pageview
 * - 监听 window 上的 'fgrze:api-error' 事件上报接口失败
 * - 只发送路径与事件类型，不含任何个人信息
 * - 接口不存在（例如静态托管）时静默失败，不影响页面
 */

const TRACK_URL = '/api/track';

function beacon(path: string, event: string, ok = true) {
  try {
    const payload = JSON.stringify({ path, event, ok });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(TRACK_URL, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(TRACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* 忽略 */
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const lastPath = useRef<string>('');

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    beacon(pathname, 'pageview');

    // 上报接口失败（天气等）
    const onApiError = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      beacon(detail.path || pathname, detail.event || 'api_error', false);
    };
    window.addEventListener('fgrze:api-error', onApiError);
    return () => window.removeEventListener('fgrze:api-error', onApiError);
  }, [pathname]);

  return null;
}
