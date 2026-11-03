/**
 * 天气后端代理（高德开放平台）
 *
 * 前端 → 本路由 → 高德 Web 服务 API
 *   · Key 只存在于服务端环境变量 AMAP_KEY，不会出现在任何前端产物中
 *   · 服务端 TTL 缓存（默认 8 分钟），配合 CDN stale-while-revalidate
 *   · 高德错误码统一转成中文友好提示
 *
 * 用法：
 *   GET /api/weather?city=310100            按 adcode 查天气（实况 + 预报）
 *   GET /api/weather?action=locate&location=120.15,30.27   经纬度反查城市
 *   GET /api/weather?action=ip              IP 定位（浏览器拒绝授权时的兜底）
 *   GET /api/weather?action=cities          常用城市表
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AmapError,
  CITY_TABLE,
  buildLifeIndices,
  fetchAmapIpLocation,
  fetchAmapRegeo,
  fetchAmapWeather,
  type AmapLive,
} from '@/lib/amap';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ------------------------------------------------------------------ */
/* 服务端缓存                                                          */
/* ------------------------------------------------------------------ */

const CACHE_TTL_MS = 8 * 60 * 1000; // 8 分钟
const MAX_CACHE_ENTRIES = 200;

type CacheEntry = { expiresAt: number; payload: unknown };

const globalCache = globalThis as unknown as { __amapWeatherCache?: Map<string, CacheEntry> };
const cache: Map<string, CacheEntry> =
  globalCache.__amapWeatherCache ?? (globalCache.__amapWeatherCache = new Map<string, CacheEntry>());

function readCache(key: string): unknown | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.payload;
}

function writeCache(key: string, payload: unknown): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // 简单淘汰最早写入的若干条
    const oldest = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    for (let i = 0; i < 20 && i < oldest.length; i++) cache.delete(oldest[i][0]);
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
}

/* ------------------------------------------------------------------ */
/* 响应工具                                                            */
/* ------------------------------------------------------------------ */

/**
 * 高德对无效 adcode 会返回 `lives: [[]]`（数组套空数组），
 * 而不是空数组或错误码，这里必须挑出真正带 adcode 的那一条。
 */
function pickLive(res: { lives?: unknown }): AmapLive | null {
  const lives = Array.isArray(res.lives) ? res.lives : [];
  for (const item of lives) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const live = item as AmapLive;
      if (live.adcode && live.temperature !== undefined) return live;
    }
  }
  return null;
}

/** 取预报；casts 为空时视为无预报 */
function pickForecast(res: { forecasts?: unknown }) {
  const list = Array.isArray(res.forecasts) ? res.forecasts : [];
  for (const item of list) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const f = item as { city?: string; adcode?: string; province?: string; reporttime?: string; casts?: unknown[] };
      if (Array.isArray(f.casts) && f.casts.length > 0) {
        return {
          city: f.city ?? '',
          adcode: f.adcode ?? '',
          province: f.province ?? '',
          reporttime: f.reporttime ?? '',
          casts: f.casts as NonNullable<typeof f.casts>,
        };
      }
    }
  }
  return null;
}

const CORS_HEADERS: Record<string, string> = {
  // 允许静态托管（GitHub Pages）从其它域调用本代理
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(payload: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(payload, {
    status,
    headers: {
      ...CORS_HEADERS,
      // 允许 CDN 在后台刷新，回源用户始终拿到新鲜数据
      'Cache-Control': 'public, max-age=60, s-maxage=480, stale-while-revalidate=600',
      ...extraHeaders,
    },
  });
}

function fail(err: unknown) {
  if (err instanceof AmapError) {
    return json(
      { ok: false, code: err.code, message: err.message },
      err.status,
      { 'Cache-Control': 'no-store' },
    );
  }
  console.error('[api/weather] 未预期错误:', err);
  return json(
    { ok: false, code: 'INTERNAL_ERROR', message: '服务器开小差了，请稍后再试。' },
    500,
    { 'Cache-Control': 'no-store' },
  );
}

/* ------------------------------------------------------------------ */
/* 路由                                                                */
/* ------------------------------------------------------------------ */

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const action = params.get('action') || 'weather';

  try {
    /* ---------------- 城市表 ---------------- */
    if (action === 'cities') {
      return json({ ok: true, cities: CITY_TABLE });
    }

    /* ---------------- 经纬度反查 ---------------- */
    if (action === 'locate') {
      const raw = params.get('location') || '';
      const [lngStr, latStr] = raw.split(',');
      const lng = Number(lngStr);
      const lat = Number(latStr);

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return json(
          { ok: false, code: 'INVALID_LOCATION', message: '经纬度格式不正确。' },
          400,
          { 'Cache-Control': 'no-store' },
        );
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return json(
          { ok: false, code: 'INVALID_LOCATION', message: '经纬度超出有效范围。' },
          400,
          { 'Cache-Control': 'no-store' },
        );
      }

      const cacheKey = `regeo:${lng.toFixed(3)},${lat.toFixed(3)}`;
      const cached = readCache(cacheKey);
      if (cached) return json(cached);

      const result = await fetchAmapRegeo(lng, lat);
      const payload = { ok: true, location: result };
      writeCache(cacheKey, payload);
      return json(payload);
    }

    /* ---------------- IP 定位兜底 ---------------- */
    if (action === 'ip') {
      const cached = readCache('ip:me');
      if (cached) return json(cached);

      const result = await fetchAmapIpLocation();
      if (!result) {
        return json(
          {
            ok: false,
            code: 'IP_LOCATION_UNAVAILABLE',
            message: '暂时无法通过网络定位判断所在城市，请手动选择。',
          },
          404,
          { 'Cache-Control': 'no-store' },
        );
      }
      const payload = { ok: true, location: result };
      writeCache('ip:me', payload);
      return json(payload);
    }

    /* ---------------- 默认：按 adcode 查天气 ---------------- */
    const city = (params.get('city') || '').trim();
    if (!city) {
      return json(
        { ok: false, code: 'MISSING_CITY', message: '缺少城市编码（adcode）参数。' },
        400,
        { 'Cache-Control': 'no-store' },
      );
    }
    if (!/^\d{6}$/.test(city)) {
      return json(
        { ok: false, code: 'INVALID_CITY', message: '城市编码格式不正确，应为 6 位 adcode。' },
        400,
        { 'Cache-Control': 'no-store' },
      );
    }

    const cacheKey = `weather:${city}`;
    const cached = readCache(cacheKey);
    if (cached) {
      return json(cached, 200, { 'X-Cache': 'HIT' });
    }

    // 实况 + 预报并行请求，节省总耗时
    const [baseRes, allRes] = await Promise.all([
      fetchAmapWeather(city, 'base'),
      fetchAmapWeather(city, 'all'),
    ]);

    const live = pickLive(baseRes);
    if (!live) {
      throw new AmapError('没有查询到该城市的天气数据，请更换城市试试。', 404, 'CITY_NOT_FOUND');
    }

    const forecast = pickForecast(allRes);

    const payload = {
      ok: true,
      live,
      forecast,
      life: buildLifeIndices(live),
      source: 'amap',
      fetchedAt: new Date().toISOString(),
    };

    writeCache(cacheKey, payload);
    return json(payload, 200, { 'X-Cache': 'MISS' });
  } catch (err) {
    return fail(err);
  }
}
