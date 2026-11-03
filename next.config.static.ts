import type { NextConfig } from "next";

// 静态导出专用配置：用于 GitHub Pages / 任意静态托管
//
// 部署在「根域名」时（<user>.github.io 仓库 / 自有域名）无需任何变量；
// 部署在「仓库子路径」时（https://<user>.github.io/<repo>/）需要：
//   NEXT_PUBLIC_BASE_PATH=/<repo>
// 构建脚本 build-static.sh 会自动读取 BASE_PATH 环境变量。
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(BASE_PATH ? { basePath: BASE_PATH, assetPrefix: BASE_PATH } : {}),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
