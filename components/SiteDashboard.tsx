'use client';

import { useEffect, useState } from 'react';
// 🌟 引入咱们的控制中心配置
import { siteConfig } from '../siteConfig';

export default function SiteDashboard() {
  const [timeStr, setTimeStr] = useState('');
  const [uptime, setUptime] = useState({ days: 0, hours: 0, minutes: 0 });

  // 🌟 从配置中读取建站时间
  const START_DATE = new Date(siteConfig.buildDate || '2026-03-23T00:00:00').getTime();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // 格式化当前时间为 HH:MM:SS
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );

      // 计算运行时间
      const diff = now.getTime() - START_DATE;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      setUptime({ days, hours, minutes });
    };

    updateTime(); // 初始执行一次
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [START_DATE]);

  const stats = [
    { label: '运行天数', value: `${uptime.days}`, unit: '天' },
    { label: '运行小时', value: `${uptime.hours}`, unit: '时' },
    { label: '运行分钟', value: `${uptime.minutes}`, unit: '分' },
  ];

  return (
    // 流式布局：所有子块都用 flex-wrap + min-w-0，小屏自动换行且不会溢出
    <div className="md:col-span-12 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden flex flex-wrap items-stretch transition-colors duration-700">
      {/* 左侧：翻页时钟特效 (使用等宽字体) */}
      <div className="w-full shrink-0 basis-full sm:basis-48 md:basis-auto bg-slate-900 dark:bg-black text-white px-6 py-4 sm:px-8 md:py-5 flex items-center justify-center font-mono text-2xl md:text-3xl font-black tracking-widest shadow-inner relative overflow-hidden group-hover:text-indigo-400 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <span className="relative">{timeStr || '00:00:00'}</span>
        {/* 模拟翻页中间的分割线 */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-black/50" />
      </div>

      {/* 中间：运行时间统计（流式三宫格，小屏自动换行） */}
      <div className="flex-1 min-w-[240px] px-4 py-4 sm:px-6 md:px-8 md:py-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            系统已稳定运行
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 min-w-0">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline gap-1 rounded-xl bg-white/50 dark:bg-slate-900/40 px-2.5 py-1 border border-white/40 dark:border-white/5 whitespace-nowrap"
            >
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{s.label}</span>
              <span className="text-base md:text-lg font-black tabular-nums text-indigo-600 dark:text-indigo-400">
                {s.value}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{s.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：技术栈徽章 + 备案信息（自动换行，不撑破容器） */}
      <div className="w-full sm:w-auto shrink-0 px-4 pb-4 sm:px-6 sm:pb-0 md:py-5 md:pr-8 flex flex-wrap items-center gap-2 md:gap-3 min-w-0">
        {siteConfig.footerBadges?.map((badge, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-white/50 dark:bg-slate-700/50 rounded-md shadow-sm flex items-center gap-1 border border-white/40 dark:border-slate-600 whitespace-nowrap text-[10px] md:text-[11px] font-bold"
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${badge.color}`} fill="currentColor" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: badge.svg }} />
            {badge.name}
          </span>
        ))}

        {siteConfig.icpConfig && (
          <a
            href={siteConfig.icpConfig.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] md:text-[11px] font-bold hover:text-indigo-500 transition-colors border-b border-dashed border-slate-400 dark:border-slate-500 pb-0.5 whitespace-nowrap max-w-full truncate"
          >
            {siteConfig.icpConfig.name}
          </a>
        )}
      </div>
    </div>
  );
}
