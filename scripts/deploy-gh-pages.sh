#!/usr/bin/env bash
# 把 out/ 推送到 GitHub Pages（gh-pages 分支）
#
# 用法：
#   GITHUB_TOKEN=ghp_xxx pnpm deploy:pages
#   GITHUB_TOKEN=ghp_xxx pnpm deploy:pages https://github.com/<user>/<repo>.git
#
# 可选环境变量：
#   NEXT_PUBLIC_WEATHER_API_BASE  静态托管时指向已部署的天气代理
#                                  （Vercel 或 Cloudflare Worker），不填则自动降级到公开备用接口
#   BASE_PATH                     仓库子路径，不填则自动从 git remote 推断
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE="${1:-$(git config --get remote.origin.url 2>/dev/null || true)}"
if [ -z "$REMOTE" ]; then
  echo "❌ 没有找到 git remote，请先添加 origin，或把仓库地址作为第一个参数传入"
  exit 1
fi

# 用 token 构造带认证的推送地址（只在本次推送生效，不写入 git config）
PUSH_REMOTE="$REMOTE"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  PUSH_REMOTE="$(printf '%s' "$REMOTE" | sed -E "s#^https://#https://x-access-token:${GITHUB_TOKEN}@#")"
  export GIT_TERMINAL_PROMPT=0
fi

echo "ℹ️ 目标仓库：$REMOTE"
if [ -n "${NEXT_PUBLIC_WEATHER_API_BASE:-}" ]; then
  echo "ℹ️ 天气代理：$NEXT_PUBLIC_WEATHER_API_BASE"
else
  echo "ℹ️ 未配置天气代理，天气页将自动降级到公开备用接口（仍支持网络定位）"
fi

bash scripts/build-static.sh

cd out
git init -q
git add -A
git commit -qm "deploy: $(date '+%Y-%m-%d %H:%M')"
git branch -M gh-pages
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git push -f "$PUSH_REMOTE" gh-pages

echo "✅ 已推送到 gh-pages"
echo "   仓库 Settings → Pages → Source 选择 gh-pages 分支 / 根目录"
