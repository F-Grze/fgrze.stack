/**
 * 基础访问监控
 *
 * 目的：
 *   1. 统计页面访问量（按路径聚合）
 *   2. 统计接口失败率（尤其是天气代理的失败率）
 *
 * 隐私约定：只记录路径、时间戳、来源域名与事件类型，
 *           不采集 IP、User-Agent 原文、Cookie 或任何个人信息。
 *           数据只存在单实例内存里，进程重启即清空。
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Counters {
  /** 路径 → 访问次数 */
  views: Map<string, number>;
  /** 事件名 → 次数 */
  events: Map<string, number>;
  /** 最近 100 条事件流水 */
  recent: Array<{ t: string; path: string; event: string; ok: boolean }>;
  startedAt: number;
  total: number;
}

const g = globalThis as unknown as { __trackCounters?: Counters };

function getCounters(): Counters {
  if (!g.__trackCounters) {
    g.__trackCounters = {
      views: new Map(),
      events: new Map(),
      recent: [],
      startedAt: Date.now(),
      total: 0,
    };
  }
  return g.__trackCounters;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** 上报事件 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = String(body?.path || '/').slice(0, 200);
    const event = String(body?.event || 'pageview').slice(0, 40);
    const ok = body?.ok !== false;

    const c = getCounters();
    c.total += 1;

    if (event === 'pageview') {
      c.views.set(path, (c.views.get(path) || 0) + 1);
    }
    c.events.set(event, (c.events.get(event) || 0) + 1);
    c.recent.push({ t: new Date().toISOString(), path, event, ok });
    if (c.recent.length > 100) c.recent.shift();

    return NextResponse.json({ ok: true }, { status: 200, headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: CORS_HEADERS });
  }
}

/** 查看统计 */
export async function GET(request: NextRequest) {
  const c = getCounters();
  const wantsStats = request.nextUrl.searchParams.get('stats') === '1';

  const payload = wantsStats
    ? {
        ok: true,
        uptimeSec: Math.round((Date.now() - c.startedAt) / 1000),
        total: c.total,
        views: Object.fromEntries([...c.views.entries()].sort((a, b) => b[1] - a[1])),
        events: Object.fromEntries(c.events),
        recent: c.recent.slice(-30).reverse(),
      }
    : { ok: true, tracked: c.total };

  return NextResponse.json(payload, {
    headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' },
  });
}
