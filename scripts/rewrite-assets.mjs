#!/usr/bin/env node
/**
 * GitHub Pages 子路径适配：把产物里写死的根绝对资源路径加上 basePath 前缀。
 *
 * 为什么需要：Next 的 basePath 只自动处理 /_next 静态资源与 <Link> 路由，
 * 但本站有大量手写的 "/media/xxx.webp"、"/bg/x.webp"（来自 siteConfig、
 * markdown front matter、data/*.ts），Next 不会给它们加前缀。
 *
 * 用法：node scripts/rewrite-assets.mjs [basePath]
 * 无 basePath 时不做任何修改（用于自定义域名 / 根域名部署）。
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'out';
const BASE = (process.argv[2] || '').replace(/\/+$/, '');

if (!BASE) {
  console.log('ℹ️  未指定 basePath，跳过资源路径重写');
  process.exit(0);
}

const ASSETS = [
  '/media/',
  '/bg/',
  '/images/',
  '/avatar.webp',
  '/icon.png',
  '/siamese-cat.png',
  '/spaceship.bin',
  '/file.svg',
  '/globe.svg',
];

const EXT = new Set(['.html', '.js', '.css', '.json', '.txt', '.xml']);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (EXT.has(path.extname(e.name))) acc.push(p);
  }
  return acc;
}

function rewrite(str) {
  for (const a of ASSETS) {
    const re = new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    str = str.replace(re, (match, offset, whole) => {
      // 已经带前缀，跳过
      if (whole.slice(offset - BASE.length, offset) === BASE) return match;
      // 相对路径（../media/、./media/）本身就是对的，不动
      if (whole[offset - 1] === '.') return match;
      // Next 自己的静态目录（/_next/static/media/*.woff2 等）不动
      if (whole.slice(Math.max(0, offset - 12), offset) === '_next/static') return match;
      return BASE + a;
    });
  }
  return str;
}

const files = walk(OUT);
let changed = 0;
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  const after = rewrite(before);
  if (after !== before) {
    fs.writeFileSync(f, after);
    changed++;
  }
}
console.log(`✅ 资源路径已加前缀 ${BASE}（改写 ${changed}/${files.length} 个文件）`);
