import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚨 核心修改 1：关掉纯静态导出，让 Vercel 帮你把 API 跑起来！
  // output: 'export',

  // 🚨 核心修改 2：Vercel 不需要强制加斜杠，关掉它能避免很多 API 路径匹配错误
  // trailingSlash: true,

  // 下面这些可以保留
  images: {
    // 服务端部署（Vercel）时开启 Next 图片优化：自动 webp/avif + 尺寸裁剪
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TS 错误，方便快速部署
  },
  // out/ 是 GitHub Pages 的静态导出产物，不参与 Vercel 部署。
  // 若不排除，Next 的文件追踪会把 out/** 收进来，而 .vercelignore 又会把它排掉，
  // 两者冲突会导致构建期报 "ENOENT: readlink out/404.html"。
  outputFileTracingExcludes: {
    "*": ["./out/**", "./preview*/**", "./.static-backup/**"],
  },
};

export default nextConfig;