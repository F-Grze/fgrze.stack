'use client';

import { useEffect, useState } from 'react';

interface Stats {
  ok: boolean;
  uptimeSec?: number;
  total?: number;
  views?: Record<string, number>;
  events?: Record<string, number>;
  recent?: Array<{ t: string; path: string; event: string; ok: boolean }>;
}

/**
 * 访问统计小面板
 * 数据来自 /api/track（服务端内存计数，重启即清零）
 * 静态托管没有该接口时显示占位说明，不影响页面。
 */
export default function TrafficStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/track?stats=1', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('bad status');
        const json = await res.json();
        if (alive && json?.ok) setStats(json);
        else if (alive) setUnavailable(true);
      } catch {
        if (alive) setUnavailable(true);
      }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (unavailable) {
    return (
      <div className="rounded-2xl border border-white/70 bg-white/75 px-5 py-6 text-center text-[13px] text-[#6F5A46] backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-400">
        当前部署没有开启访问统计接口（静态托管下 /api/track 不存在）
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-white/70 bg-white/75 px-5 py-8 text-center backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-[2px] border-[#B4613A] border-t-transparent" />
      </div>
    );
  }

  const views = Object.entries(stats.views || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = views.length ? views[0][1] : 1;
  const errors = (stats.events || {})['weather_error'] || 0;
  const weatherCalls = ((stats.events || {})['pageview'] || 0) + errors;

  return (
    <div className="space-y-4">
      {/* 概览 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '总事件', value: stats.total ?? 0 },
          { label: '访问页面', value: Object.keys(stats.views || {}).length },
          { label: '天气失败', value: errors },
          { label: '运行时长', value: `${Math.floor((stats.uptimeSec ?? 0) / 60)} 分` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40"
          >
            <p className="text-[11px] font-bold tracking-widest text-[#6F5A46]">{s.label}</p>
            <p className="mt-1 text-xl font-black tabular-nums text-[#33251C] dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 页面访问排行 */}
      {views.length > 0 && (
        <div className="rounded-2xl border border-white/70 bg-white/75 p-5 backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#6F5A46]">
            页面访问 Top {views.length}
          </p>
          <div className="space-y-2.5">
            {views.map(([path, count]) => (
              <div key={path} className="flex items-center gap-3">
                <span className="w-28 flex-none truncate text-[12px] font-bold text-[#4A382C] dark:text-slate-200 sm:w-40">
                  {path}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EADBC6] dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#B4613A] to-[#D99A5B] transition-all duration-700"
                    style={{ width: `${Math.max((count / max) * 100, 4)}%` }}
                  />
                </div>
                <span className="w-8 flex-none text-right text-[12px] font-black tabular-nums text-[#6F5A46]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 接口健康度 */}
      <div className="rounded-2xl border border-white/70 bg-white/75 p-5 backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#6F5A46]">
          天气接口失败率
        </p>
        <div className="flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#EADBC6] dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                errors > 0 ? 'bg-gradient-to-r from-[#C0563A] to-[#E08A5B]' : 'bg-gradient-to-r from-[#2F6B45] to-[#5AA878]'
              }`}
              style={{
                width: `${weatherCalls ? Math.min((errors / weatherCalls) * 100, 100) : 0}%`,
              }}
            />
          </div>
          <span className="w-24 flex-none text-right text-[12px] font-black tabular-nums text-[#4A382C] dark:text-slate-200">
            {errors} / {weatherCalls}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-[#8A7360]">
          仅统计路径与事件类型，不采集 IP、UA 原文或任何个人信息
        </p>
      </div>
    </div>
  );
}
