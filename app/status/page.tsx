import fs from 'fs';
import path from 'path';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import StatusClock from './StatusClock';
import { siteConfig } from '../../siteConfig';
import { albums } from '../../data/albums';
import { projectsData } from '../../data/projects';
import { friendsData } from '../../data/friends';

export const metadata = {
  title: '状态 | ' + siteConfig.title,
  description: '站点运行状态与内容统计',
};

function countMd(dir: string) {
  const p = path.join(process.cwd(), dir);
  try {
    return fs.readdirSync(p).filter((f) => f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

function readVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export default function StatusPage() {
  const photoCount = albums.reduce((sum, a) => sum + a.photos.length, 0);
  const stats = [
    { label: '文章', value: countMd('posts'), unit: '篇' },
    { label: '杂谈', value: countMd('chatters'), unit: '篇' },
    { label: '说说', value: countMd('moments'), unit: '条' },
    { label: '照片', value: photoCount, unit: '张' },
    { label: '项目', value: projectsData.length, unit: '个' },
    { label: '友链', value: friendsData.length, unit: '位' },
  ];

  const modules = [
    { name: '站内搜索', state: '正常', tone: 'ok', note: '本地索引，无服务端依赖' },
    { name: '音乐播放', state: '正常', tone: 'ok', note: '公开 Meting 接口，静态可用' },
    { name: '天气', state: '正常', tone: 'ok', note: 'Open-Meteo 实时数据' },
    { name: '评论', state: '未启用', tone: 'warn', note: '需在 siteConfig 填入 Gitalk 参数' },
    { name: '每日选刊', state: '已关闭', tone: 'off', note: '与源模板一致，无归档数据' },
  ];

  const toneClass: Record<string, string> = {
    ok: 'bg-[#E7F3EA] text-[#2F6B45]',
    warn: 'bg-[#FBEFD8] text-[#8A5A18]',
    off: 'bg-[#EFEAE4] text-[#7A6A5C]',
  };

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28 w-[92%] max-w-5xl mx-auto pb-10">
          <div className="mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#B4613A]/70">Status</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-[#33251C] dark:text-white">
              站点状态
            </h1>
            <p className="mt-2 text-sm text-[#4E3D30] dark:text-slate-400">
              运行时间、内容规模与各模块可用性
            </p>
          </div>

          <StatusClock buildDate={siteConfig.buildDate || '2026-03-23T00:00:00'} version={readVersion()} />

          {/* 内容统计 */}
          <div className="mt-10 mb-4 flex items-center gap-3">
            <span className="h-3 w-[3px] rounded-full bg-[#B4613A]" />
            <h2 className="rounded-full bg-white/75 px-3 py-1 text-[12px] font-black tracking-[0.2em] text-[#3F2F23] backdrop-blur-sm dark:bg-slate-700/60 dark:text-slate-100">内容</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/70 bg-white/75 px-4 py-5 text-center backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40"
              >
                <p className="text-[11px] font-bold tracking-widest text-[#6F5A46]">{s.label}</p>
                <p className="mt-2 text-2xl font-black leading-none text-[#33251C] dark:text-white">
                  {s.value}
                  <span className="ml-1 text-[11px] font-bold text-[#6F5A46]">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* 模块状态 */}
          <div className="mt-10 mb-4 flex items-center gap-3">
            <span className="h-3 w-[3px] rounded-full bg-[#B4613A]" />
            <h2 className="rounded-full bg-white/75 px-3 py-1 text-[12px] font-black tracking-[0.2em] text-[#3F2F23] backdrop-blur-sm dark:bg-slate-700/60 dark:text-slate-100">模块</h2>
          </div>
          <div className="divide-y divide-[#E7CEB4]/50 overflow-hidden rounded-[24px] border border-white/70 bg-white/72 backdrop-blur-md dark:divide-white/5 dark:border-white/10 dark:bg-slate-800/40">
            {modules.map((m) => (
              <div key={m.name} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <span className="w-24 flex-none text-sm font-black text-[#33251C] dark:text-white">{m.name}</span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-black ${toneClass[m.tone]}`}>
                  {m.state}
                </span>
                <span className="flex-1 text-right text-[12px] text-[#544335] dark:text-slate-400">{m.note}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[11px] text-[#6F5A46]">
            构建于 GitHub Pages · 静态导出 · 最近构建时间见页面底部
          </p>
        </div>
      </PageTransition>
    </div>
  );
}
