"use client";

import { useEffect, useState } from 'react';

export default function StatusClock({ buildDate, version }: { buildDate: string; version: string }) {
  const [time, setTime] = useState('--:--:--');
  const [uptime, setUptime] = useState('—');

  useEffect(() => {
    const start = new Date(buildDate).getTime();
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour12: false }));
      const diff = Math.max(0, now.getTime() - start);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff / 3600000) % 24);
      const minutes = Math.floor((diff / 60000) % 60);
      setUptime(`${days} 天 ${hours} 小时 ${minutes} 分`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [buildDate]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/75 shadow-[0_10px_40px_rgba(120,86,54,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40">
      <div className="flex flex-col md:flex-row">
        <div className="flex items-center justify-center bg-[#33251C] px-8 py-6 dark:bg-black md:w-64">
          <span className="font-mono text-3xl font-black tracking-[0.12em] text-[#F6E7D6]">{time}</span>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-6 px-7 py-6">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#6F5A46]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#3E9E68]" />
              Online
            </p>
            <p className="mt-2 text-sm font-black text-[#33251C] dark:text-white">
              已稳定运行 <span className="text-[#B4613A]">{uptime}</span>
            </p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6F5A46]">版本</p>
              <p className="mt-1 text-sm font-black text-[#33251C] dark:text-white">v{version}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6F5A46]">部署</p>
              <p className="mt-1 text-sm font-black text-[#33251C] dark:text-white">GitHub Pages</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#6F5A46]">渲染</p>
              <p className="mt-1 text-sm font-black text-[#33251C] dark:text-white">静态导出</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
