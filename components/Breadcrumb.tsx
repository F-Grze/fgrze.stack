'use client';

import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * 面包屑导航
 * 让读者随时知道自己在站内的哪一层。
 */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="面包屑"
      className="flex flex-wrap items-center text-[12px] font-bold text-[#8A7360] dark:text-slate-400"
    >
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="breadcrumb-item inline-flex items-center">
          {item.href ? (
            <Link
              href={item.href}
              className="transition-colors hover:text-[#B4613A] dark:hover:text-amber-300"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#5A4739] dark:text-slate-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
