'use client';

import Image from 'next/image';
import { useState } from 'react';

const PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9">' +
      '<rect width="16" height="9" fill="#E8DCC9"/>' +
      '<rect width="16" height="9" fill="#000" opacity="0.04"/>' +
      '</svg>',
  );

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** 覆盖默认的 fill 模式尺寸 */
  fill?: boolean;
  quality?: number;
}

/**
 * 统一的图片组件：
 *  - Next.js Image 自动做 webp/avif 协商与尺寸裁剪
 *  - 默认 blur 占位，避免大图加载时的白屏 / 布局抖动（CLS）
 *  - 加载完成后淡入，配合懒加载减少首屏压力
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className = '',
  priority = false,
  fill = false,
  quality = 72,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width || 1200}
      height={fill ? undefined : height || 800}
      fill={fill}
      sizes={sizes}
      quality={quality}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      placeholder="blur"
      blurDataURL={PLACEHOLDER}
      onLoad={() => setLoaded(true)}
      className={`lazy-img ${loaded ? '' : ''} ${className}`}
      data-loaded={loaded}
      style={fill ? { objectFit: 'cover' } : undefined}
    />
  );
}
