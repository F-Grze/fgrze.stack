/**
 * RSS 2.0 订阅源
 *
 * 静态导出时会在 out/rss.xml 生成静态文件；
 * 服务端部署时按请求实时生成（带短缓存）。
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://f-grze.github.io'
).replace(/\/+$/, '');
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

function esc(str: string) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(request: NextRequest) {
  let items = '';

  try {
    const postsDirectory = path.join(process.cwd(), 'posts');
    if (fs.existsSync(postsDirectory)) {
      const posts = fs
        .readdirSync(postsDirectory)
        .filter((f) => f.endsWith('.md'))
        .map((fileName) => {
          const slug = fileName.replace(/\.md$/, '');
          const raw = fs.readFileSync(path.join(postsDirectory, fileName), 'utf8');
          const { data, content } = matter(raw);
          return {
            slug,
            title: data.title || '无标题',
            date: data.date ? new Date(data.date) : new Date(),
            description: data.description || '',
            content: content || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            category: typeof data.category === 'string' ? data.category : '技术',
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 30);

      items = posts
        .map((p) => {
          const link = `${SITE_URL}${BASE_PATH}/posts/${p.slug}/`;
          const pubDate = new Date(p.date).toUTCString();
          const categories = [p.category, ...p.tags]
            .map((c) => `<category>${esc(c)}</category>`)
            .join('');
          return `<item>
    <title>${esc(p.title)}</title>
    <link>${esc(link)}</link>
    <guid isPermaLink="true">${esc(link)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${esc(p.description)}</description>
    ${categories}
    <content:encoded><![CDATA[${p.content.replace(/<\/?[^>]+>/g, '').slice(0, 4000)}]]></content:encoded>
  </item>`;
        })
        .join('\n');
    }
  } catch (e) {
    console.error('[rss] 生成失败:', e);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>F-Grzeの光影日志</title>
    <link>${esc(SITE_URL + BASE_PATH + '/')}</link>
    <description>在代码与涂鸦之间往返的人。写点前端、做点视觉，把墙上的噪音整理成页面。</description>
    <language>zh-cn</language>
    <generator>F-Grze Blog</generator>
    <atom:link href="${esc(SITE_URL + BASE_PATH + '/rss.xml')}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
