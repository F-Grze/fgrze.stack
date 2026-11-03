"use client";

import { useCallback, useEffect, useState } from 'react';

type City = { id: string; name: string; lat: number; lon: number };

const CITIES: City[] = [
  { id: 'hangzhou', name: '杭州', lat: 30.2741, lon: 120.1551 },
  { id: 'beijing', name: '北京', lat: 39.9042, lon: 116.4074 },
  { id: 'shanghai', name: '上海', lat: 31.2304, lon: 121.4737 },
  { id: 'chengdu', name: '成都', lat: 30.5728, lon: 104.0668 },
  { id: 'guangzhou', name: '广州', lat: 23.1291, lon: 113.2644 },
];

// WMO 天气代码 → 中文 + 图标
const WEATHER: Record<number, { text: string; icon: string }> = {
  0: { text: '晴', icon: '☀️' },
  1: { text: '大部晴朗', icon: '🌤️' },
  2: { text: '多云', icon: '⛅' },
  3: { text: '阴', icon: '☁️' },
  45: { text: '有雾', icon: '🌫️' },
  48: { text: '雾凇', icon: '🌫️' },
  51: { text: '小毛毛雨', icon: '🌦️' },
  53: { text: '毛毛雨', icon: '🌦️' },
  55: { text: '浓毛毛雨', icon: '🌧️' },
  56: { text: '冻毛毛雨', icon: '🌧️' },
  57: { text: '强冻毛毛雨', icon: '🌧️' },
  61: { text: '小雨', icon: '🌦️' },
  63: { text: '中雨', icon: '🌧️' },
  65: { text: '大雨', icon: '🌧️' },
  66: { text: '冻雨', icon: '🌧️' },
  67: { text: '强冻雨', icon: '🌧️' },
  71: { text: '小雪', icon: '🌨️' },
  73: { text: '中雪', icon: '🌨️' },
  75: { text: '大雪', icon: '❄️' },
  77: { text: '雪粒', icon: '🌨️' },
  80: { text: '阵雨', icon: '🌦️' },
  81: { text: '强阵雨', icon: '🌧️' },
  82: { text: '暴雨', icon: '⛈️' },
  85: { text: '阵雪', icon: '🌨️' },
  86: { text: '强阵雪', icon: '❄️' },
  95: { text: '雷阵雨', icon: '⛈️' },
  96: { text: '雷雨伴冰雹', icon: '⛈️' },
  99: { text: '强雷雨伴冰雹', icon: '⛈️' },
};

const wx = (code: number) => WEATHER[code] || { text: '未知天气', icon: '🌡️' };

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

type WeatherState = {
  current: any;
  hourly: any;
  daily: any;
};

export default function WeatherClient() {
  const [city, setCity] = useState<City>(CITIES[0]);
  const [data, setData] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  const load = useCallback(async (target: City) => {
    setLoading(true);
    setError('');
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lon}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl' +
      '&hourly=temperature_2m,weather_code,precipitation_probability' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset' +
      '&timezone=Asia%2FShanghai&forecast_days=7';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('接口返回异常');
      const json = await res.json();
      setData({ current: json.current, hourly: json.hourly, daily: json.daily });
      setUpdatedAt(
        new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      setError('天气数据暂时取不到，请稍后再试。');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(city);
  }, [city, load]);

  const cur = data?.current;
  const nowIndex = data ? Math.max(0, data.hourly.time.findIndex((t: string) => new Date(t) >= new Date())) : 0;
  const hours = data ? data.hourly.time.slice(nowIndex, nowIndex + 12).map((t: string, i: number) => ({
    time: t,
    temp: Math.round(data.hourly.temperature_2m[nowIndex + i]),
    code: data.hourly.weather_code[nowIndex + i],
    pop: data.hourly.precipitation_probability?.[nowIndex + i] ?? 0,
  })) : [];

  return (
    <div className="w-[92%] max-w-5xl mx-auto pb-10">
      {/* 标题 */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#B4613A]/70">Weather</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-[#33251C] dark:text-white">
            今日天气
          </h1>
          <p className="mt-2 text-sm text-[#4E3D30] dark:text-slate-400">
            {city.name} · 实时观测与未来一周预报
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCity(c)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors ${
                c.id === city.id
                  ? 'bg-[#B4613A] text-white shadow-sm'
                  : 'bg-white/60 text-[#5A4739] hover:bg-white/90 dark:bg-slate-800/60 dark:text-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/70 bg-white/72 p-16 text-center backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-[#B4613A] border-t-transparent" />
          <p className="text-sm font-bold text-[#4E3D30] dark:text-slate-300">正在读取气象数据…</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-white/70 bg-white/72 p-12 text-center backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
          <p className="text-4xl">🌥️</p>
          <p className="mt-4 text-sm font-bold text-[#4E3D30] dark:text-slate-300">{error}</p>
          <button
            onClick={() => load(city)}
            className="mt-5 rounded-full bg-[#B4613A] px-6 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            重新加载
          </button>
        </div>
      )}

      {!loading && !error && cur && (
        <>
          {/* 当前天气 */}
          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/75 shadow-[0_10px_40px_rgba(120,86,54,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
            <div className="flex flex-col gap-8 p-7 md:flex-row md:items-center md:justify-between md:p-9">
              <div className="flex items-center gap-6">
                <div className="text-6xl leading-none md:text-7xl">{wx(cur.weather_code).icon}</div>
                <div>
                  <div className="flex items-start gap-1">
                    <span className="text-6xl font-black leading-none tracking-tighter text-[#33251C] dark:text-white">
                      {Math.round(cur.temperature_2m)}
                    </span>
                    <span className="mt-2 text-2xl font-black text-[#B4613A]">°C</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-[#4A382C] dark:text-slate-200">
                    {wx(cur.weather_code).text}
                  </p>
                  <p className="mt-1 text-xs text-[#5E4B3B] dark:text-slate-400">
                    体感 {Math.round(cur.apparent_temperature)}° · 更新于 {updatedAt}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm md:grid-cols-2">
                {[
                  ['湿度', `${Math.round(cur.relative_humidity_2m)}%`],
                  ['风速', `${Math.round(cur.wind_speed_10m)} km/h`],
                  ['气压', `${Math.round(cur.pressure_msl)} hPa`],
                  ['降水', `${cur.precipitation ?? 0} mm`],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#6F5A46]">{k}</p>
                    <p className="mt-1 text-lg font-black text-[#33251C] dark:text-white">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#E7CEB4]/60 px-7 py-3 text-[12px] text-[#544335] dark:border-white/5 dark:text-slate-400 md:px-9">
              <span>日出 {data?.daily.sunrise?.[0]?.slice(11, 16)} · 日落 {data?.daily.sunset?.[0]?.slice(11, 16)}</span>
              <span>数据源 Open-Meteo</span>
            </div>
          </div>

          {/* 未来 12 小时 */}
          <div className="mt-10 mb-4 flex items-center gap-3">
            <span className="h-3 w-[3px] rounded-full bg-[#B4613A]" />
            <h2 className="rounded-full bg-white/75 px-3 py-1 text-[12px] font-black tracking-[0.2em] text-[#3F2F23] backdrop-blur-sm dark:bg-slate-700/60 dark:text-slate-100">未来 12 小时</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {hours.map((h: any) => (
              <div
                key={h.time}
                className="min-w-[86px] flex-none rounded-2xl border border-white/70 bg-white/72 px-3 py-4 text-center backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40"
              >
                <p className="text-[11px] font-bold text-[#5E4B3B] dark:text-slate-400">{h.time.slice(11, 16)}</p>
                <p className="my-2 text-2xl leading-none">{wx(h.code).icon}</p>
                <p className="text-base font-black text-[#33251C] dark:text-white">{h.temp}°</p>
                <p className="mt-1 text-[10px] text-[#6F5A46]">{h.pop}%</p>
              </div>
            ))}
          </div>

          {/* 一周预报 */}
          <div className="mt-8 mb-4 flex items-center gap-3">
            <span className="h-3 w-[3px] rounded-full bg-[#B4613A]" />
            <h2 className="rounded-full bg-white/75 px-3 py-1 text-[12px] font-black tracking-[0.2em] text-[#3F2F23] backdrop-blur-sm dark:bg-slate-700/60 dark:text-slate-100">未来一周</h2>
          </div>
          <div className="divide-y divide-[#E7CEB4]/50 overflow-hidden rounded-[24px] border border-white/70 bg-white/72 backdrop-blur-md dark:divide-white/5 dark:border-white/10 dark:bg-slate-800/40">
            {data!.daily.time.map((d: string, i: number) => {
              const date = new Date(d + 'T00:00:00');
              const info = wx(data!.daily.weather_code[i]);
              return (
                <div key={d} className="flex items-center gap-4 px-6 py-4">
                  <span className="w-14 flex-none text-sm font-black text-[#33251C] dark:text-white">
                    {i === 0 ? '今天' : WEEK[date.getDay()]}
                  </span>
                  <span className="w-16 flex-none text-[11px] font-bold text-[#6F5A46]">
                    {d.slice(5).replace('-', '/')}
                  </span>
                  <span className="w-8 flex-none text-xl">{info.icon}</span>
                  <span className="flex-1 text-sm font-bold text-[#4A382C] dark:text-slate-200">{info.text}</span>
                  <span className="w-14 flex-none text-right text-[11px] text-[#6F5A46]">
                    {data!.daily.precipitation_probability_max[i] ?? 0}%
                  </span>
                  <span className="w-24 flex-none text-right text-sm font-black text-[#33251C] dark:text-white">
                    {Math.round(data!.daily.temperature_2m_max[i])}°
                    <span className="ml-1 font-bold text-[#6F5A46]">
                      / {Math.round(data!.daily.temperature_2m_min[i])}°
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
