'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* 灯箱：支持左右翻图、键盘、触摸滑动                                   */
/* ------------------------------------------------------------------ */

export interface LightboxItem {
  url: string;
  caption?: string;
  albumName?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function Lightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const closeRef = useRef(false);

  const open = index !== null && index >= 0 && index < items.length;
  const current = open ? items[index as number] : null;

  const prev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + items.length) % items.length);
  }, [index, items.length, onIndexChange]);

  const next = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % items.length);
  }, [index, items.length, onIndexChange]);

  /* 键盘操作 */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, prev, next]);

  /* 切换图片时重置加载态 */
  useEffect(() => {
    setLoaded(false);
  }, [index]);

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
    >
      {/* 顶部信息条 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {current.albumName && (
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black tracking-widest text-white/70">
              {current.albumName}
            </span>
          )}
          <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black tracking-widest text-white/70">
            {(index as number) + 1} / {items.length}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="shrink-0 rounded-full bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
          aria-label="关闭预览"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 左右翻页按钮 */}
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white/70 transition hover:bg-white/25 hover:text-white sm:left-5 sm:p-3"
            aria-label="上一张"
          >
            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white/70 transition hover:bg-white/25 hover:text-white sm:right-5 sm:p-3"
            aria-label="下一张"
          >
            <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 图片本体 */}
      <div
        className="relative z-10 flex max-h-[78vh] w-full max-w-6xl items-center justify-center px-12 sm:px-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(delta) > 50) {
            if (delta > 0) prev();
            else next();
          }
          touchStartX.current = null;
        }}
      >
        <Image
          src={current.url}
          alt={current.caption || '全屏照片'}
          width={1600}
          height={1100}
          sizes="(max-width: 768px) 90vw, 80vw"
          quality={88}
          priority
          onLoad={() => setLoaded(true)}
          className={`max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-2xl transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* 说明文字 */}
      {current.caption && (
        <div
          className="absolute bottom-6 left-1/2 z-20 max-w-[86vw] -translate-x-1/2 rounded-full bg-white/10 px-6 py-2.5 text-center text-sm font-medium tracking-wide text-white shadow-2xl backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {current.caption}
        </div>
      )}

      {/* 缩略图导航 */}
      {items.length > 1 && (
        <div
          className="absolute bottom-20 left-1/2 z-20 hidden max-w-[86vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl bg-white/5 p-2 backdrop-blur-md sm:flex"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <button
              key={`${item.url}-${i}`}
              onClick={() => onIndexChange(i)}
              className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index ? 'border-[#B4613A]' : 'border-transparent opacity-55 hover:opacity-90'
              }`}
              aria-label={`跳转到第 ${i + 1} 张`}
            >
              <Image src={item.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
