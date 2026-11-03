/**
 * 站点地图 sitemap.xml
 * 静态导出时生成静态文件，服务端部署时按请求生成。
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://f-grze.github.io'
).replace(/\/+$/, '');
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

const STATIC_ROUTES: Array<{ path: string; priority: string; freq: string }> = [
  { path: '/', priority: '1.0', freq: 'daily' },
  { path: '/timeline', priority: '0.8', freq: 'weekly' },
  { path: '/photowall', priority: '0.7', freq: 'weekly' },
  { path: '/projects', priority: '0.7', freq: 'monthly' },
  { path: '/chatter', priority: '0.7', freq: 'weekly' },
  { path: '/moments', priority: '0.6', freq: 'daily' },
  { path: '/music', priority: '0.6', freq: 'monthly' },
  { path: '/tree', priority: '0.6', freq: 'monthly' },
  { path: '/friends', priority: '0.5', freq: 'monthly' },
  { path: '/weather', priority: '0.6', freq: 'daily' },
  { path: '/about', priority: '0.5', freq: 'monthly' },
  { path: '/status', priority: '0.4', freq: 'daily' },
];

export async function GET() {
  const now = new Date().toISOString();

  const urls = STATIC_ROUTES.map(
    (r) => `  <url>
    <loc>${SITE_URL}${BASE_PATH}${r.path === '/' ? '/' : `${r.path}/`}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.freq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
