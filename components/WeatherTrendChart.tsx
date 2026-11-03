'use client';

import { useId, useMemo, useRef, useState } from 'react';

export interface TrendPoint {
  date: string;
  week: string;
  daytemp: string;
  nighttemp: string;
  dayweather?: string;
  nightweather?: string;
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

const W = 760;
const H = 250;
const PAD = { top: 46, right: 26, bottom: 54, left: 26 };

interface P {
  x: number;
  y: number;
}

/** Catmull-Rom → 三次贝塞尔，得到平滑又不失真的折线 */
function smoothPath(points: P[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * 未来天气趋势折线图。
 *
 * 刻意不用 recharts / chart.js：它们会给首屏再加 80–150KB 的 JS，
 * 而这里只需要一条高低温柔和曲线，用原生 SVG 十几行就能画完，
 * 且完全走合成器，不给主线程添负担。
 */
export default function WeatherTrendChart({ points }: { points: TrendPoint[] }) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const model = useMemo(() => {
    const rows = points
      .map((p) => ({
        ...p,
        high: Number(p.daytemp),
        low: Number(p.nighttemp),
      }))
      .filter((p) => Number.isFinite(p.high) && Number.isFinite(p.low));

    if (rows.length === 0) return null;

    const temps = rows.flatMap((r) => [r.high, r.low]);
    const rawMin = Math.min(...temps);
    const rawMax = Math.max(...temps);
    // 上下留白，避免曲线贴边；温度区间为 0 时给一个最小跨度
    const span = Math.max(rawMax - rawMin, 4);
    const min = rawMin - span * 0.22;
    const max = rawMax + span * 0.22;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const step = rows.length > 1 ? innerW / (rows.length - 1) : 0;

    const xOf = (i: number) => PAD.left + i * step;
    const yOf = (v: number) => PAD.top + ((max - v) / (max - min)) * innerH;

    const highPts = rows.map((r, i) => ({ x: xOf(i), y: yOf(r.high) }));
    const lowPts = rows.map((r, i) => ({ x: xOf(i), y: yOf(r.low) }));

    return { rows, min, max, xOf, yOf, highPts, lowPts, innerH };
  }, [points]);

  if (!model) return null;

  const { rows, xOf, yOf, highPts, lowPts } = model;
  const highPath = smoothPath(highPts);
  const lowPath = smoothPath(lowPts);

  // 高温柔和渐变面积：从曲线向下淡出
  const areaPath = `${highPath} L ${highPts[highPts.length - 1].x} ${H - PAD.bottom} L ${highPts[0].x} ${H - PAD.bottom} Z`;

  const dayLabel = (i: number) =>
    i === 0 ? '今天' : i === 1 ? '明天' : WEEK_LABEL[rows[i].week] ?? rows[i].date.slice(5);

  const handlePointer = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || rows.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const xInViewBox = ratio * W;
    const step = rows.length > 1 ? (W - PAD.left - PAD.right) / (rows.length - 1) : 1;
    const idx = Math.round((xInViewBox - PAD.left) / step);
    setActive(Math.max(0, Math.min(rows.length - 1, idx)));
  };

  const activeRow = active !== null ? rows[active] : null;
  const activeX = active !== null ? xOf(active) : 0;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-pan-y select-none"
        role="img"
        aria-label={`未来 ${rows.length} 天温度趋势：最高温 ${rows
          .map((r) => r.high)
          .join('、')} 度，最低温 ${rows.map((r) => r.low).join('、')} 度`}
        onPointerMove={(e) => handlePointer(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onPointerDown={(e) => handlePointer(e.clientX)}
      >
        <defs>
          <linearGradient id={`hi-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B4613A" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#B4613A" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 横向参考线 */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + t * (H - PAD.top - PAD.bottom)}
            y2={PAD.top + t * (H - PAD.top - PAD.bottom)}
            stroke="currentColor"
            strokeOpacity="0.10"
            strokeDasharray="4 6"
          />
        ))}

        {/* 高温柔和面积 */}
        <path d={areaPath} fill={`url(#hi-${uid})`} />

        {/* 高温线 */}
        <path d={highPath} fill="none" stroke="#B4613A" strokeWidth="2.6" strokeLinecap="round" />

        {/* 低温线 */}
        <path
          d={lowPath}
          fill="none"
          stroke="#6E8CA8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="1 0"
          opacity="0.9"
        />

        {/* 悬停竖线 */}
        {active !== null && (
          <line
            x1={activeX}
            x2={activeX}
            y1={PAD.top - 8}
            y2={H - PAD.bottom + 4}
            stroke="#B4613A"
            strokeOpacity="0.35"
            strokeDasharray="3 4"
          />
        )}

        {/* 数据点与数值 */}
        {rows.map((r, i) => {
          const isActive = active === i;
          return (
            <g key={r.date}>
              <circle
                cx={highPts[i].x}
                cy={highPts[i].y}
                r={isActive ? 5.5 : 3.6}
                fill="#fff"
                stroke="#B4613A"
                strokeWidth={isActive ? 3 : 2.2}
              />
              <circle
                cx={lowPts[i].x}
                cy={lowPts[i].y}
                r={isActive ? 5.5 : 3.6}
                fill="#fff"
                stroke="#6E8CA8"
                strokeWidth={isActive ? 3 : 2.2}
              />

              {/* 温度数值 */}
              <text
                x={highPts[i].x}
                y={highPts[i].y - 12}
                textAnchor="middle"
                fontSize="13"
                fontWeight="800"
                fill="#B4613A"
              >
                {r.high}°
              </text>
              <text
                x={lowPts[i].x}
                y={lowPts[i].y + 21}
                textAnchor="middle"
                fontSize="12.5"
                fontWeight="700"
                fill="#5F7C97"
              >
                {r.low}°
              </text>

              {/* 日期 */}
              <text
                x={xOf(i)}
                y={H - PAD.bottom + 26}
                textAnchor="middle"
                fontSize="12.5"
                fontWeight={isActive ? '800' : '700'}
                fill={isActive ? '#B4613A' : '#5A4739'}
              >
                {dayLabel(i)}
              </text>
              <text
                x={xOf(i)}
                y={H - PAD.bottom + 43}
                textAnchor="middle"
                fontSize="10.5"
                fill="#8A7360"
                opacity="0.8"
              >
                {r.date.slice(5).replace('-', '/')}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 触摸/悬停时的高亮信息条（HTML 层，避免 SVG 文本换行限制） */}
      {activeRow && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-[#33251C] px-3.5 py-1.5 text-[12px] font-bold text-white shadow-lg">
          {activeRow.date.slice(5).replace('-', '/')} · {dayLabel(active!)} · {activeRow.dayweather || '—'}{' '}
          <span className="text-[#F0C9A8]">
            {activeRow.low}° ~ {activeRow.high}°
          </span>
        </div>
      )}

      {/* 图例 */}
      <div className="mt-1 flex items-center justify-center gap-5 text-[11px] font-bold">
        <span className="inline-flex items-center gap-1.5 text-[#B4613A]">
          <span className="h-[3px] w-5 rounded-full bg-[#B4613A]" />
          最高温
        </span>
        <span className="inline-flex items-center gap-1.5 text-[#5F7C97]">
          <span className="h-[3px] w-5 rounded-full bg-[#6E8CA8]" />
          最低温
        </span>
      </div>
    </div>
  );
}
