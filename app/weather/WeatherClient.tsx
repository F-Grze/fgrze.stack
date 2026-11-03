'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CITY_TABLE, type CityEntry } from '../../lib/cities';
import { buildLifeIndices, openMeteoText, windDir } from '../../lib/life-index';
import WeatherTrendChart from '../../components/WeatherTrendChart';

/* ------------------------------------------------------------------ */
/* 常量与工具                                                          */
/* ------------------------------------------------------------------ */

/**
 * 天气接口地址。
 * - 默认走同源 /api/weather（Vercel / Node 部署，Key 留在服务端）
 * - 静态托管（GitHub Pages）没有 API Route 时，
 *   构建期设置 NEXT_PUBLIC_WEATHER_API_BASE 指向已部署的代理即可，例如
 *   NEXT_PUBLIC_WEATHER_API_BASE=https://your-app.vercel.app/api/weather
 */
const API_BASE = (process.env.NEXT_PUBLIC_WEATHER_API_BASE || '').replace(/\/+$/, '');

const API_URL = `${API_BASE}/api/weather`;
const CACHE_PREFIX = 'fgrze.weather.cache.';
const CITY_MEMO_KEY = 'fgrze.weather.city';
const PLACES_KEY = 'fgrze.weather.places';
const CACHE_TTL = 8 * 60 * 1000; // 本地缓存 8 分钟
const SEARCH_DEBOUNCE = 320; // 城市搜索防抖
// 定位失败时的兜底城市（与 CITY_TABLE 首项保持一致，含坐标）
const DEFAULT_CITY: CityEntry = CITY_TABLE.find((c) => c.adcode === '110100') ?? {
  adcode: '110100',
  name: '北京',
  province: '北京市',
  lat: 39.9042,
  lng: 116.4074,
};
const REQUEST_DEBOUNCE = 320; // 切换城市防抖，避免连续点击打爆配额

/** 天气现象 → 图标 / 分类 */
function weatherMeta(weather: string): {
  icon: string;
  kind: 'clear' | 'cloud' | 'rain' | 'snow' | 'fog' | 'storm';
} {
  const w = weather || '';
  if (/雷|冰雹/.test(w)) return { icon: '⛈️', kind: 'storm' };
  if (/雪|霰|冻雨|冻毛/.test(w)) return { icon: '❄️', kind: 'snow' };
  if (/雨/.test(w)) return { icon: '🌧️', kind: 'rain' };
  if (/雾|霾|沙|尘/.test(w)) return { icon: '🌫️', kind: 'fog' };
  if (/阴/.test(w)) return { icon: '☁️', kind: 'cloud' };
  if (/多云/.test(w)) return { icon: '⛅', kind: 'cloud' };
  if (/晴/.test(w)) return { icon: '☀️', kind: 'clear' };
  return { icon: '🌡️', kind: 'cloud' };
}

const WEEK_LABEL: Record<string, string> = {
  '1': '周一',
  '2': '周二',
  '3': '周三',
  '4': '周四',
  '5': '周五',
  '6': '周六',
  '7': '周日',
};

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

interface LiveWeather {
  province: string;
  city: string;
  adcode: string;
  weather: string;
  temperature: string;
  winddirection: string;
  windpower: string;
  humidity: string;
  reporttime: string;
}

interface Cast {
  date: string;
  week: string;
  dayweather: string;
  nightweather: string;
  daytemp: string;
  nighttemp: string;
  daywind: string;
  nightwind: string;
  daypower: string;
  nightpower: string;
}

interface LifeIndex {
  key: string;
  name: string;
  level: string;
  advice: string;
  icon: string;
}

interface WeatherPayload {
  live: LiveWeather;
  forecast: { city: string; adcode: string; province: string; reporttime: string; casts: Cast[] } | null;
  life: LifeIndex[];
  source: string;
  fetchedAt: string;
}

/** 降级通道（静态托管 / 代理未部署时）使用的数据源 */
const FALLBACK_SOURCE = 'open-meteo';

interface ApiError {
  code: string;
  message: string;
}

/** 用户自建地点，比 CityEntry 多一个地址别名，便于区分同名城市 */
interface SavedPlace extends CityEntry {
  address?: string;
  district?: string;
}

/* ------------------------------------------------------------------ */
/* 骨架屏                                                              */
/* ------------------------------------------------------------------ */

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E8DCC9]/70 dark:bg-white/10 ${className}`} />;
}

function WeatherSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="wx-card rounded-[28px] p-7 md:p-9">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <SkeletonBlock className="h-16 w-16 !rounded-2xl md:h-20 md:w-20" />
            <div className="space-y-3">
              <SkeletonBlock className="h-12 w-32" />
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-3 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <SkeletonBlock className="h-3 w-10" />
                <SkeletonBlock className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
        <SkeletonBlock className="mt-6 h-3 w-full !rounded-lg" />
      </div>

      <div>
        <SkeletonBlock className="mb-4 h-7 w-32 !rounded-full" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-24 w-full !rounded-2xl" />
          ))}
        </div>
      </div>

      <div>
        <SkeletonBlock className="mb-4 h-7 w-32 !rounded-full" />
        <SkeletonBlock className="h-56 w-full !rounded-[24px]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export default function WeatherClient() {
  const [city, setCity] = useState<CityEntry>({
    adcode: '110100',
    name: '北京',
    province: '北京市',
  });
  const [payload, setPayload] = useState<WeatherPayload | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<ApiError | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateNote, setLocateNote] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [showAllDays, setShowAllDays] = useState(false);

  /* 自建地点 */
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [searchResults, setSearchResults] = useState<SavedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);

  const requestSeq = useRef(0);
  const inflightKey = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeq = useRef(0);

  /* ------------------------------------------------------------------ */
  /* 降级通道：高德代理不可用时（例如静态托管没部署 /api/weather），      */
  /* 改用公开的 Open-Meteo 接口，仍然支持「定位我」显示当地天气。          */
  /* ------------------------------------------------------------------ */
  const fetchOpenMeteo = useCallback(
    async (target: CityEntry, coords?: { lat: number; lng: number }) => {
      // 目标城市若没带坐标，回查城市表补齐
      const fallbackEntry = CITY_TABLE.find((c) => c.adcode === target.adcode);
      const lat = coords?.lat ?? target.lat ?? fallbackEntry?.lat;
      const lng = coords?.lng ?? target.lng ?? fallbackEntry?.lng;
      if (lat === undefined || lng === undefined) {
        throw {
          code: 'NO_COORDS',
          message: '当前部署没有天气代理，且该地点缺少坐标数据，请手动选择其它城市。',
        } as ApiError;
      }

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
        '&timezone=Asia%2FShanghai&forecast_days=7';

      const res = await fetch(url);
      if (!res.ok) {
        throw { code: 'FALLBACK_FAILED', message: '备用天气接口暂时不可用，请稍后再试。' } as ApiError;
      }
      const json = await res.json();

      const cur = json.current;
      const daily = json.daily;
      const casts: Cast[] = (daily?.time ?? []).map((d: string, i: number) => {
        const date = new Date(`${d}T00:00:00`);
        const text = openMeteoText(daily.weather_code[i]);
        return {
          date: d,
          week: String(date.getDay() === 0 ? 7 : date.getDay()),
          dayweather: text,
          nightweather: text,
          daytemp: String(Math.round(daily.temperature_2m_max[i])),
          nighttemp: String(Math.round(daily.temperature_2m_min[i])),
          daywind: windDir(daily.wind_direction_10m?.max?.[i] ?? json.current.wind_direction_10m),
          nightwind: windDir(daily.wind_direction_10m?.max?.[i] ?? json.current.wind_direction_10m),
          daypower: '1-3',
          nightpower: '1-3',
        };
      });

      const live: LiveWeather = {
        province: target.province || '',
        city: target.name,
        adcode: target.adcode,
        weather: openMeteoText(cur.weather_code),
        temperature: String(Math.round(cur.temperature_2m)),
        winddirection: windDir(cur.wind_direction_10m),
        windpower: '≤3',
        humidity: String(Math.round(cur.relative_humidity_2m)),
        reporttime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      };

      return {
        live,
        forecast: {
          city: target.name,
          adcode: target.adcode,
          province: target.province || '',
          reporttime: new Date().toISOString(),
          casts,
        },
        life: buildLifeIndices(live),
        source: FALLBACK_SOURCE,
        fetchedAt: new Date().toISOString(),
      } as WeatherPayload;
    },
    [],
  );

  /* --------------------- 城市搜索防抖 --------------------- */
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(cityQuery.trim()), SEARCH_DEBOUNCE);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [cityQuery]);

  /** 本地城市表兜底过滤（静态托管 / 接口不可用时仍能搜到常用城市） */
  const localMatches = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return CITY_TABLE.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q) ||
        c.adcode.includes(q),
    );
  }, [debouncedQuery]);

  /* --------------------- 远程地点搜索（支持任意城市/区县） --------------------- */
  useEffect(() => {
    const q = debouncedQuery;
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      setSearchNote(null);
      return;
    }

    const seq = ++searchSeq.current;
    setSearching(true);
    setSearchNote(null);

    (async () => {
      try {
        const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`, {
          headers: { Accept: 'application/json' },
        });
        const json = await res.json();
        if (seq !== searchSeq.current) return;
        if (!res.ok || json?.ok === false) {
          throw new Error(json?.message || '搜索服务暂时不可用');
        }
        const list: SavedPlace[] = (json.places || []).map((p: any) => ({
          adcode: String(p.adcode || ''),
          name: p.name || q,
          province: p.province || '',
          district: p.district || '',
          address: p.address || '',
          ...(typeof p.lat === 'number' ? { lat: p.lat } : {}),
          ...(typeof p.lng === 'number' ? { lng: p.lng } : {}),
        }));
        setSearchResults(list.filter((p) => p.adcode));
        if (list.length === 0) setSearchNote(json?.message || '没有找到匹配的地点。');
      } catch {
        if (seq !== searchSeq.current) return;
        // 接口不可用 → 退回本地城市表，至少能选到常用城市
        setSearchResults([]);
        setSearchNote('地点搜索接口不可用，已切换为本地常用城市匹配。');
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    })();
  }, [debouncedQuery]);

  /* --------------------- 请求封装 --------------------- */
  const fetchWeather = useCallback(
    async (target: CityEntry, opts: { force?: boolean } = {}) => {
      const key = target.adcode;

      // 1) 本地缓存命中（8 分钟内不再请求，节省高德配额）
      if (!opts.force && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(CACHE_PREFIX + key);
          if (raw) {
            const cached = JSON.parse(raw) as { ts: number; payload: WeatherPayload };
            if (Date.now() - cached.ts < CACHE_TTL) {
              setPayload(cached.payload);
              setStatus('success');
              setError(null);
              setFromCache(true);
              setDegraded(cached.payload?.source === FALLBACK_SOURCE);
              setUpdatedAt(
                new Date(cached.ts).toLocaleTimeString('zh-CN', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              );
              return;
            }
            localStorage.removeItem(CACHE_PREFIX + key);
          }
        } catch {
          /* 缓存损坏则忽略 */
        }
      }

      // 2) 同一城市的请求正在进行中 → 直接复用，不重复打 API
      if (inflightKey.current === key) return;

      const seq = ++requestSeq.current;
      inflightKey.current = key;
      setStatus('loading');
      setError(null);
      setFromCache(false);

      try {
        const res = await fetch(`${API_URL}?city=${encodeURIComponent(key)}`, {
          headers: { Accept: 'application/json' },
        });

        let json: any;
        try {
          json = await res.json();
        } catch {
          throw {
            code: 'BAD_RESPONSE',
            message: '服务端返回了无法解析的数据，请稍后再试。',
          } as ApiError;
        }

        if (!res.ok || json?.ok === false) {
          throw {
            code: json?.code || 'REQUEST_FAILED',
            message: json?.message || `请求失败（HTTP ${res.status}）`,
          } as ApiError;
        }

        if (seq !== requestSeq.current) return; // 已有更新的请求，丢弃过期响应

        const data = json as WeatherPayload;
        setPayload(data);
        setStatus('success');
        setDegraded(data.source === FALLBACK_SOURCE);
        setUpdatedAt(
          new Date().toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
        try {
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), payload: data }));
          localStorage.setItem(CITY_MEMO_KEY, JSON.stringify(target));
        } catch {
          /* 隐私模式下 localStorage 可能不可写 */
        }
      } catch (err: any) {
        if (seq !== requestSeq.current) return;
        const isApiError = err && typeof err.code === 'string';

        // 代理不可用（静态托管 / 代理未部署）→ 自动切到 Open-Meteo 降级通道
        const proxyMissing =
          !isApiError ||
          err.code === 'NETWORK_ERROR' ||
          err.code === 'BAD_RESPONSE' ||
          err.code === 'REQUEST_FAILED';
        if (proxyMissing && !opts.force) {
          try {
            const fallbackPayload = await fetchOpenMeteo(target);
            if (seq !== requestSeq.current) return;
            setPayload(fallbackPayload);
            setStatus('success');
            setError(null);
            setFromCache(false);
            setDegraded(true);
            setUpdatedAt(
              new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            );
            try {
              localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), payload: fallbackPayload }));
              localStorage.setItem(CITY_MEMO_KEY, JSON.stringify(target));
            } catch {
              /* ignore */
            }
            return;
          } catch {
            /* 降级也失败 → 走下面的错误展示 */
          }
        }

        setError({
          code: isApiError ? err.code : 'NETWORK_ERROR',
          message: isApiError ? err.message : '网络连接失败，请检查网络后重试。',
        });
        setStatus('error');

        // 埋点：上报接口失败率（只记录路径与错误码）
        try {
          window.dispatchEvent(
            new CustomEvent('fgrze:api-error', {
              detail: { path: '/weather', event: 'weather_error', code: isApiError ? err.code : 'NETWORK_ERROR' },
            }),
          );
        } catch {
          /* ignore */
        }
      } finally {
        if (inflightKey.current === key) inflightKey.current = null;
      }
    },
    [fetchOpenMeteo],
  );

  /* --------------------- IP 定位兜底 --------------------- */
  const locateByIp = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}?action=ip`, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (!res.ok || !json?.ok) return false;
      const loc = json.location;
      const target: CityEntry = {
        adcode: loc.adcode,
        name: loc.city || loc.province || '当前位置',
        province: loc.province || '',
      };
      setCity(target);
      await fetchWeather(target);
      return true;
    } catch {
      return false;
    }
  }, [fetchWeather]);

  /* --------------------- 定位全部失败时的兜底 --------------------- */
  const loadFallbackCity = useCallback(async () => {
    // 优先用上次记住的城市，其次默认北京
    let memo: CityEntry | null = null;
    try {
      const raw = localStorage.getItem(CITY_MEMO_KEY);
      if (raw) memo = JSON.parse(raw) as CityEntry;
    } catch {
      /* ignore */
    }
    const target = memo?.adcode ? memo : DEFAULT_CITY;
    setCity(target);
    await fetchWeather(target);
  }, [fetchWeather]);

  /* --------------------- 浏览器网络定位 --------------------- */
  const locateMe = useCallback(async () => {
    setLocating(true);
    setLocateNote(null);

    const fail = async (reason: string) => {
      setLocateNote(reason);
      const ok = await locateByIp();
      if (!ok) await loadFallbackCity();
    };

    try {
      // 1) 环境前提：定位需要安全上下文（HTTPS 或 localhost）
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        await fail('当前页面不是 HTTPS，浏览器禁止网页获取定位，已改用网络定位。');
        return;
      }
      // 2) 浏览器不支持
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        await fail('当前浏览器不支持定位，已改用网络定位。');
        return;
      }

      // 3) 先看权限状态，被明确拒绝时直接走兜底，省掉 8 秒超时等待
      try {
        const perm = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
        if (perm?.state === 'denied') {
          await fail('定位权限已被拒绝，可在浏览器地址栏的站点设置里重新允许，已先用网络定位。');
          return;
        }
      } catch {
        /* 部分浏览器不支持 permissions.query，忽略 */
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 9000,
          maximumAge: 10 * 60 * 1000,
          enableHighAccuracy: false,
        });
      });

      const { longitude, latitude } = position.coords;
      const res = await fetch(
        `${API_URL}?action=locate&location=${longitude.toFixed(5)},${latitude.toFixed(5)}`,
        { headers: { Accept: 'application/json' } },
      );
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '定位失败');
      }
      const loc = json.location;
      const target: CityEntry = {
        adcode: loc.adcode,
        name: loc.city || loc.district || loc.province || '当前位置',
        province: loc.province || '',
        lat: Number(latitude.toFixed(5)),
        lng: Number(longitude.toFixed(5)),
      };
      setCity(target);
      await fetchWeather(target);
    } catch (err: any) {
      // 区分具体原因，给用户可操作的提示
      const code = typeof err?.code === 'number' ? err.code : null;
      let reason = '定位失败，已改用网络定位。';
      if (code === 1) reason = '你拒绝了定位授权，已改用网络定位；也可在站点设置里重新允许。';
      else if (code === 2) reason = '设备暂时无法确定位置，已改用网络定位。';
      else if (code === 3) reason = '定位超时，已改用网络定位。';
      else if (err?.message) reason = `${err.message}，已改用网络定位。`;
      await fail(reason);
    } finally {
      setLocating(false);
    }
  }, [fetchWeather, locateByIp, loadFallbackCity]);

  /* --------------------- 切换城市（防抖） --------------------- */
  const pickCity = useCallback(
    (target: CityEntry) => {
      setCity(target);
      setPickerOpen(false);
      setCityQuery('');
      setLocateNote(null);
      // 连续点击时防抖，避免打爆高德配额
      if (locateTimer.current) clearTimeout(locateTimer.current);
      locateTimer.current = setTimeout(() => fetchWeather(target), REQUEST_DEBOUNCE);
    },
    [fetchWeather],
  );

  /* --------------------- 自建地点：增删 --------------------- */
  const persistPlaces = useCallback((next: SavedPlace[]) => {
    setPlaces(next);
    try {
      localStorage.setItem(PLACES_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const addPlace = useCallback(
    (place: SavedPlace) => {
      const next = [place, ...places.filter((p) => p.adcode !== place.adcode)].slice(0, 12);
      persistPlaces(next);
      pickCity(place);
    },
    [places, persistPlaces, pickCity],
  );

  const removePlace = useCallback(
    (adcode: string) => {
      persistPlaces(places.filter((p) => p.adcode !== adcode));
    },
    [places, persistPlaces],
  );

  /* --------------------- 初始化 --------------------- */
  useEffect(() => {
    let cancelled = false;

    /** 静默定位：已有缓存城市时，后台悄悄判断当前位置，不打断阅读 */
    const silentLocate = async () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return;
      if (typeof window !== 'undefined' && !window.isSecureContext) return;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            maximumAge: 30 * 60 * 1000,
            enableHighAccuracy: false,
          });
        });
        const { longitude, latitude } = position.coords;
        const res = await fetch(
          `${API_URL}?action=locate&location=${longitude.toFixed(5)},${latitude.toFixed(5)}`,
          { headers: { Accept: 'application/json' } },
        );
        const json = await res.json();
        if (!res.ok || !json?.ok) return;
        const loc = json.location;
        const target: CityEntry = {
          adcode: loc.adcode,
          name: loc.city || loc.district || loc.province || '当前位置',
          province: loc.province || '',
        };
        if (cancelled) return;
        setCity(target);
        await fetchWeather(target);
      } catch {
        /* 用户未授权定位：保持手动选择的城市 */
      }
    };

    // 恢复自建地点列表
    try {
      const rawPlaces = localStorage.getItem(PLACES_KEY);
      if (rawPlaces) {
        const parsed = JSON.parse(rawPlaces);
        if (Array.isArray(parsed)) setPlaces(parsed.filter((p: any) => p?.adcode).slice(0, 12));
      }
    } catch {
      /* ignore */
    }

    const boot = async () => {
      // 1) 优先恢复上次查询的城市（记忆）
      let memo: CityEntry | null = null;
      try {
        const raw = localStorage.getItem(CITY_MEMO_KEY);
        if (raw) memo = JSON.parse(raw) as CityEntry;
      } catch {
        /* ignore */
      }

      if (memo && memo.adcode) {
        setCity(memo);
        await fetchWeather(memo);
        if (!cancelled) await silentLocate();
        return;
      }

      // 2) 首次访问：走浏览器网络定位
      await locateMe();
    };

    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------- 派生数据 --------------------- */
  const live = payload?.live;
  const meta = live ? weatherMeta(live.weather) : null;
  const casts = payload?.forecast?.casts ?? [];
  const visibleCasts = showAllDays ? casts : casts.slice(0, 4);
  const reportTime = live?.reporttime ?? '';
  const displayCity = city.name || live?.city || '当前位置';
  // 高德对直辖市会返回 province="北京" + city="北京城区"，直接拼接会变成
  // 「北京北京城区」；这里做一次去重，保证只显示一次行政区名。
  const liveRegion =
    live && live.city
      ? live.province && live.city.startsWith(live.province)
        ? live.city
        : `${live.province || ''}${live.city}`
      : '';
  const today = casts[0];

  const listForPicker = debouncedQuery
    ? searchResults.length > 0
      ? searchResults
      : localMatches
    : [];

  return (
    <div className="w-[94%] max-w-5xl mx-auto pb-16">
      {/* ================= 气象站标识（左上角，醒目大字） ================= */}
      <header className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <h1 className="text-[46px] font-black leading-[0.95] tracking-[-0.03em] text-[#33251C] sm:text-[56px] md:text-[68px] dark:text-white">
            气象站
          </h1>
          <span className="mb-2 text-[10px] font-black uppercase tracking-[0.45em] text-[#B4613A] md:text-[11px]">
            Weather&nbsp;Station
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-[3px] w-16 rounded-full bg-[#B4613A]" />
          <span className="h-[3px] w-5 rounded-full bg-[#B4613A]/40" />
          <span className="h-[3px] w-2 rounded-full bg-[#B4613A]/20" />
        </div>
      </header>

      {/* ================= 城市与操作 ================= */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#33251C] md:text-3xl dark:text-white">
            {displayCity}的天气
          </h2>
          <p className="mt-2 text-sm text-[#4E3D30] dark:text-slate-400">
            {live ? `${live.weather} · 更新于 ${reportTime.slice(11, 16) || updatedAt}` : '实时观测与未来预报'}
            {fromCache && <span className="ml-2 text-[11px] text-[#8A7360]">（本地缓存）</span>}
          </p>
          {degraded && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FBEFD8] px-3 py-1 text-[11px] font-bold text-[#8A5A18]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C08A2E]" />
              当前部署未配置天气代理，已自动切换到公开备用接口
            </p>
          )}
          {locateNote && (
            <p className="mt-2 max-w-xl text-[11.5px] leading-relaxed text-[#8A5A18] dark:text-amber-300/80">
              ⓘ {locateNote}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={locateMe}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#B4613A] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"
              />
            </svg>
            {locating ? '定位中…' : '定位我'}
          </button>

          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D8C3A6] bg-white/80 px-4 py-2 text-[13px] font-bold text-[#4E3D30] transition hover:bg-white dark:border-white/15 dark:bg-slate-800/60 dark:text-slate-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            地点
          </button>

          <button
            onClick={() => fetchWeather(city, { force: true })}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D8C3A6] bg-white/80 px-4 py-2 text-[13px] font-bold text-[#4E3D30] transition hover:bg-white disabled:opacity-60 dark:border-white/15 dark:bg-slate-800/60 dark:text-slate-200"
            disabled={status === 'loading'}
          >
            <svg
              className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.6m15.4 0V4h-.6M4 20v-5h.6m15.4 0V20h-.6M4.6 9A8 8 0 0119 9m-14.4 6A8 8 0 0019 15"
              />
            </svg>
            刷新
          </button>
        </div>
      </div>

      {/* ================= 地点面板 ================= */}
      {pickerOpen && (
        <div className="wx-card mb-7 rounded-[24px] p-5">
          <div className="relative mb-5">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A7360]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="搜索任意城市 / 区县，如「杭州」「西湖」「东莞」"
              className="h-11 w-full rounded-full border border-[#E0CFB8] bg-white/90 pl-11 pr-4 text-sm text-[#33251C] outline-none transition focus:border-[#B4613A] focus:ring-2 focus:ring-[#B4613A]/25 dark:border-white/15 dark:bg-slate-900/50 dark:text-white"
            />
            {searching && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8A7360]">
                搜索中…
              </span>
            )}
          </div>

          {/* 我的地点 */}
          {places.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#8A7360]">我的地点</p>
              <div className="flex flex-wrap gap-2">
                {places.map((p) => (
                  <span
                    key={p.adcode}
                    className="group inline-flex items-center gap-1 rounded-full bg-[#EFE3D1] pl-3 pr-1.5 py-1 text-[13px] font-bold text-[#5A4739] dark:bg-white/10 dark:text-slate-200"
                  >
                    <button onClick={() => pickCity(p)} className="hover:text-[#B4613A]">
                      {p.name}
                      {p.province && <span className="ml-1 text-[11px] opacity-60">{p.province.replace(/[省市]$/, '')}</span>}
                    </button>
                    <button
                      onClick={() => removePlace(p.adcode)}
                      aria-label={`删除地点 ${p.name}`}
                      className="ml-0.5 grid h-5 w-5 place-items-center rounded-full text-[#8A7360] transition hover:bg-[#B4613A] hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 搜索结果 */}
          {debouncedQuery ? (
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#8A7360]">
                {searchResults.length > 0 ? '搜索结果（点击添加为地点）' : '本地匹配'}
              </p>

              {searchNote && (
                <p className="mb-2 text-[11.5px] text-[#8A5A18] dark:text-amber-300/80">{searchNote}</p>
              )}

              {listForPicker.length === 0 ? (
                <p className="py-5 text-center text-sm text-[#6F5A46] dark:text-slate-400">
                  {searching ? '正在搜索…' : '没有匹配的地点，换个关键词试试'}
                </p>
              ) : (
                <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
                  {listForPicker.map((c) => {
                    const saved = places.some((p) => p.adcode === c.adcode);
                    return (
                      <div
                        key={`${c.adcode}-${(c as SavedPlace).address || c.name}`}
                        className="flex items-center gap-3 rounded-2xl bg-[#F7EFE3]/80 px-3 py-2 dark:bg-white/5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-bold text-[#33251C] dark:text-white">
                            {c.name}
                            <span className="ml-1.5 text-[11px] font-normal text-[#8A7360]">
                              {(c as SavedPlace).district || c.province}
                            </span>
                          </p>
                          {(c as SavedPlace).address && (
                            <p className="truncate text-[11px] text-[#8A7360]">{(c as SavedPlace).address}</p>
                          )}
                        </div>
                        <button
                          onClick={() => addPlace(c as SavedPlace)}
                          className={`flex-none rounded-full px-3 py-1 text-[12px] font-black transition ${
                            saved
                              ? 'bg-[#B4613A]/15 text-[#B4613A]'
                              : 'bg-[#B4613A] text-white hover:opacity-90'
                          }`}
                        >
                          {saved ? '已添加' : '+ 添加'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#8A7360]">常用城市</p>
              <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
                {CITY_TABLE.map((c) => (
                  <button
                    key={c.adcode}
                    onClick={() => pickCity(c)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                      c.adcode === city.adcode
                        ? 'bg-[#B4613A] text-white'
                        : 'bg-[#F3E8D8] text-[#5A4739] hover:bg-[#EADBC6] dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20'
                    }`}
                  >
                    {c.name}
                    <span className="ml-1 opacity-60">{c.province.replace(/[省市]$/, '')}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[#8A7360]">
                找不到想要的城市？直接在上方搜索框输入任意城市或区县名，回车后即可「＋ 添加」为常用地点。
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= 加载骨架 ================= */}
      {status === 'loading' && !payload && <WeatherSkeleton />}

      {/* ================= 错误兜底 ================= */}
      {status === 'error' && (
        <div className="wx-card rounded-[28px] p-10 text-center">
          <p className="text-4xl">🌥️</p>
          <p className="mt-4 text-base font-black text-[#33251C] dark:text-white">
            {error?.message ?? '天气数据暂时取不到'}
          </p>

          <div className="mx-auto mt-3 max-w-md space-y-1 text-[13px] leading-relaxed text-[#6F5A46] dark:text-slate-400">
            {error?.code === 'RATE_LIMITED' && <p>请求太频繁，高德接口正在限流，稍等半分钟再试即可。</p>}
            {error?.code === 'QUOTA_EXHAUSTED' && <p>今日调用额度已用尽，可以先看看下面的其它内容，明天再来。</p>}
            {error?.code === 'INVALID_CITY' && <p>这个城市暂时查不到，试试用「地点」重新选一个。</p>}
            {error?.code === 'CITY_NOT_FOUND' && <p>高德没有这个 adcode 的天气数据，换一个城市试试。</p>}
            {error?.code === 'KEY_MISSING' && <p>服务端尚未配置 AMAP_KEY 环境变量。</p>}
            {error?.code === 'NETWORK_ERROR' && <p>请检查网络连接，或稍后再试一次。</p>}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => fetchWeather(city, { force: true })}
              className="rounded-full bg-[#B4613A] px-6 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              重新加载
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="rounded-full border border-[#D8C3A6] bg-white/80 px-6 py-2 text-sm font-bold text-[#4E3D30] transition hover:bg-white dark:border-white/15 dark:bg-slate-800/60 dark:text-slate-200"
            >
              换个地点
            </button>
            <button
              onClick={locateMe}
              className="rounded-full border border-[#D8C3A6] bg-white/80 px-6 py-2 text-sm font-bold text-[#4E3D30] transition hover:bg-white dark:border-white/15 dark:bg-slate-800/60 dark:text-slate-200"
            >
              用我的位置
            </button>
          </div>
        </div>
      )}

      {/* ================= 正常内容 ================= */}
      {live && payload && (
        <>
          {/* 当前天气卡 */}
          <div className="wx-card relative overflow-hidden rounded-[28px]">
            {/* 天气动画层（标签页隐藏时由 PerfGuard 统一暂停） */}
            <div
              className={`pointer-events-none absolute inset-0 overflow-hidden wx-scene wx-scene-${meta?.kind ?? 'cloud'}`}
            >
              <div className="wx-orb" />
              <div className="wx-cloud wx-cloud-1" />
              <div className="wx-cloud wx-cloud-2" />
              <div className="wx-drop wx-drop-1" />
              <div className="wx-drop wx-drop-2" />
              <div className="wx-drop wx-drop-3" />
              <div className="wx-flake wx-flake-1" />
              <div className="wx-flake wx-flake-2" />
            </div>

            <div className="relative z-10 flex flex-col gap-8 p-7 md:flex-row md:items-center md:justify-between md:p-9">
              <div className="flex items-center gap-6">
                <div className="wx-icon text-6xl leading-none md:text-7xl">{meta?.icon}</div>
                <div>
                  <div className="flex items-start gap-1">
                    <span className="text-6xl font-black leading-none tracking-tighter text-[#33251C] dark:text-white">
                      {Math.round(Number(live.temperature))}
                    </span>
                    <span className="mt-2 text-2xl font-black text-[#B4613A]">°C</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-[#4A382C] dark:text-slate-200">{live.weather}</p>
                  <p className="mt-1 text-xs text-[#5E4B3B] dark:text-slate-400">
                    {liveRegion} · 更新于 {reportTime.slice(11, 16) || updatedAt}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
                {[
                  ['湿度', `${live.humidity}%`],
                  ['风向风力', `${live.winddirection} ${live.windpower}级`],
                  ['体感温度', `${Math.round(Number(live.temperature))}°`],
                  ['数据来源', degraded ? 'Open-Meteo' : '高德天气'],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#6F5A46]">{k}</p>
                    <p className="mt-1 text-lg font-black text-[#33251C] dark:text-white">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {today && (
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7CEB4]/60 px-7 py-3 text-[12px] text-[#544335] dark:border-white/5 dark:text-slate-400 md:px-9">
                <span>
                  今日 {today.nighttemp}° ~ {today.daytemp}° · {today.dayweather} / {today.nightweather}
                </span>
                <span className="opacity-70">
                  {degraded ? '公开备用接口 · 预报每日更新' : '高德天气 · 实况每小时更新，预报每日 3 次'}
                </span>
              </div>
            )}
          </div>

          {/* 生活指数 */}
          {payload.life?.length > 0 && (
            <div className="mt-10 mb-4 flex items-center gap-3">
              <span className="h-3 w-[3px] rounded-full bg-[#B4613A]" />
              <h2 className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-black tracking-[0.2em] text-[#3F2F23] dark:bg-slate-700/60 dark:text-slate-100">
                生活指数
              </h2>
              <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-bold text-[#7A6149] dark:bg-slate-800/60 dark:text-slate-300">
                依据当前实况推算
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {payload.life?.map((idx) => (
              <div
                key={idx.key}
                className="wx-card-flat group rounded-2xl p-4 transition hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{idx.icon}</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A7360]">{idx.name}</span>
                  <span className="ml-auto rounded-full bg-[#F3E8D8] px-2 py-0.5 text-[11px] font-black text-[#B4613A] dark:bg-white/10">
                    {idx.level}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[#5A4739] dark:text-slate-300">{idx.advice}</p>
              </div>
            ))}
          </div>

          {/* 未来预报：折线图 + 明细 */}
          <div className="mt-10 mb-4 flex items-center gap-3">
            <span className="h-3 w-[3px] rounded-full bg-[#B4613A]" />
            <h2 className="rounded-full bg-white/80 px-3 py-1 text-[12px] font-black tracking-[0.2em] text-[#3F2F23] dark:bg-slate-700/60 dark:text-slate-100">
              未来预报
            </h2>
            {casts.length > 4 && (
              <button
                onClick={() => setShowAllDays((v) => !v)}
                className="ml-auto text-[12px] font-bold text-[#B4613A] hover:underline"
              >
                {showAllDays ? '收起' : `展开全部 ${casts.length} 天`}
              </button>
            )}
          </div>

          {/* 温度趋势折线图 */}
          {visibleCasts.length >= 2 && (
            <div className="wx-card mb-3 rounded-[24px] px-3 pb-2 pt-3 md:px-6 md:pb-3 md:pt-4">
              <p className="mb-1 px-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#8A7360]">
                温度趋势 · {visibleCasts.length} 天
              </p>
              <WeatherTrendChart
                points={visibleCasts.map((c) => ({
                  date: c.date,
                  week: c.week,
                  daytemp: c.daytemp,
                  nighttemp: c.nighttemp,
                  dayweather: c.dayweather,
                  nightweather: c.nightweather,
                }))}
              />
            </div>
          )}

          <div className="wx-card divide-y divide-[#E7CEB4]/50 overflow-hidden rounded-[24px] dark:divide-white/5">
            {visibleCasts.map((c, i) => {
              const dayMeta = weatherMeta(c.dayweather);
              const nightMeta = weatherMeta(c.nightweather);
              return (
                <div key={c.date} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 md:px-6">
                  <span className="w-12 flex-none text-sm font-black text-[#33251C] dark:text-white">
                    {i === 0 ? '今天' : WEEK_LABEL[c.week] ?? ''}
                  </span>
                  <span className="w-14 flex-none text-[11px] font-bold text-[#6F5A46]">
                    {c.date.slice(5).replace('-', '/')}
                  </span>
                  <span className="w-8 flex-none text-xl">{dayMeta.icon}</span>
                  <span className="flex-1 text-sm font-bold text-[#4A382C] dark:text-slate-200">
                    {c.dayweather}
                    <span className="ml-1.5 text-[11px] font-normal text-[#8A7360]">
                      夜间 {c.nightweather} {nightMeta.icon}
                    </span>
                  </span>
                  <span className="w-20 flex-none text-[11px] text-[#8A7360]">
                    {c.daywind} {c.daypower}级
                  </span>
                  <span className="w-24 flex-none text-right text-sm font-black text-[#33251C] dark:text-white">
                    {c.nighttemp}°
                    <span className="ml-1 font-bold text-[#6F5A46]">/ {c.daytemp}°</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* ================= 数据来源标注 ================= */}
          <footer className="mt-10 rounded-[22px] border border-[#E7CEB4]/60 bg-white/60 px-5 py-6 text-[12px] leading-relaxed text-[#7A6149] dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-400">
            <p className="mb-3 flex items-center gap-2 text-[13px] font-black text-[#3F2F23] dark:text-slate-200">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              数据来源
            </p>

            <ul className="space-y-1.5">
              <li>
                实况与预报：
                {degraded ? (
                  <a
                    className="font-bold text-[#B4613A] underline decoration-dotted underline-offset-2 hover:opacity-80"
                    href="https://open-meteo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open-Meteo 开放气象接口
                  </a>
                ) : (
                  <a
                    className="font-bold text-[#B4613A] underline decoration-dotted underline-offset-2 hover:opacity-80"
                    href="https://lbs.amap.com/api/webservice/guide/api/weatherinfo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    高德开放平台 · 天气查询 API
                  </a>
                )}
                <span className="ml-1 text-[11px] text-[#8A7360]">
                  {degraded ? '（公开接口，无需 Key）' : '（服务端代理调用，Key 不出现在前端）'}
                </span>
              </li>
              <li>定位与逆地理编码：{degraded ? '浏览器 Geolocation + Open-Meteo 坐标查询' : '高德开放平台 · IP 定位 / 逆地理编码'}</li>
              <li>
                更新频率：{degraded ? '当前实况约 15 分钟，预报每日更新' : '实况每小时更新，预报每日 3 次'}；
                本页本地缓存 {Math.round(CACHE_TTL / 60000)} 分钟
              </li>
              <li>
                最近更新：{reportTime || updatedAt || '—'}
                {payload.forecast?.reporttime && ` · 预报发布时间 ${payload.forecast.reporttime}`}
              </li>
            </ul>

            <p className="mt-3 border-t border-[#E7CEB4]/50 pt-3 text-[11px] leading-relaxed text-[#8A7360] dark:border-white/5">
              数据由第三方气象服务商提供，本站仅做展示与整理，可能存在延迟或偏差，仅供参考，不作为出行、农业、航空等决策依据。
              定位信息仅在本次查询中使用，不会上传存档。
            </p>
          </footer>
        </>
      )}

      {/* 首次进入且正在定位时的轻提示 */}
      {status === 'loading' && payload && (
        <p className="mt-4 text-center text-[12px] text-[#8A7360]">正在更新最新气象数据…</p>
      )}
    </div>
  );
}
