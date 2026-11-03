"use client";
import { useState, useEffect } from 'react';
import { siteConfig } from '../siteConfig';

// 轮播间隔（毫秒）：每 5 秒切换一张
const SLIDE_INTERVAL = 5000;

export default function BackgroundSlider() {
  const [index, setIndex] = useState(0);

  // 🌟 壁纸分组系统：优先使用「激活分组」的图片轮播；无分组数据时回退到旧版 bgImages
  const activeGroup = siteConfig.bgGroups?.find(
    (g) => g.id === siteConfig.activeBgGroup
  );
  const images = activeGroup ? activeGroup.images : siteConfig.bgImages || [];

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [images.length]);

  // 图片列表长度变化时重置索引，防止越界
  useEffect(() => { setIndex(0); }, [images.length]);

  return (
    <div className="absolute inset-0 z-[-10] overflow-hidden">
      {/* 纸面底色 */}
      <div className="absolute inset-0 bg-[#f6f4ee]" />

      {/* 只渲染「当前 + 下一张」。
          背景图是 position:absolute 全屏铺满，浏览器会认为它们全都在视口内，
          loading="lazy" 形同虚设 —— 5 张大图会同时抢占连接，把 async 脚本挤到队尾，
          导致 React 长时间无法 hydration。这里改为按需挂载，切换时才请求下一张。 */}
      {images.map((img, i) =>
        i <= index + 1 ? (
          <div
            key={img}
            className="bg-slide absolute inset-0 transition-opacity duration-[1600ms] ease-in-out"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            <img
              src={img}
              alt=""
              aria-hidden
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'low'}
              className="bg-art absolute inset-0 h-full w-full object-cover"
              style={{ animation: i === index ? 'kenburns 16s ease-out both' : 'none' }}
            />
          </div>
        ) : null,
      )}

      {/* 整体压一层薄纸色，保证浅色主题的明度 */}
      <div className="absolute inset-0 bg-[#f6f4ee]/26" />
      {/* 顶部与底部收边，避免画面硬切 */}
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,#f6f4ee_0%,rgba(246,244,238,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(0deg,#f6f4ee_0%,rgba(246,244,238,0)_100%)]" />
    </div>
  );
}
