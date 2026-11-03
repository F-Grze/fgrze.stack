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
#   KEEP_OLD_ASSETS=0             设为 0 可关闭「保留历史静态资源」行为
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
# out/ 是一个全新的独立仓库，需要单独给一次提交身份
git -c user.name="${GIT_AUTHOR_NAME:-F-Grze}" -c user.email="${GIT_AUTHOR_EMAIL:-hi@f-grze.dev}" \
  commit -qm "deploy: $(date '+%Y-%m-%d %H:%M')"
git branch -M gh-pages
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"

# ------------------------------------------------------------------
# 保留历史静态资源（解决 CDN 缓存错配导致的白屏）
# ------------------------------------------------------------------
# GitHub Pages 的 CDN 会缓存 HTML 最多 10 分钟。缓存期内访问到的可能是
# 上一版 HTML，它引用的 chunk 文件名在新一版产物里已经变了 —— 于是
# 脚本 404 → React 无法 hydration → 页面空白。
# 解决办法：把上一版的 _next/static 一并保留在新提交里，让新旧 HTML
# 都能找到对应的 chunk，缓存切换期间零白屏。
if [ "${KEEP_OLD_ASSETS:-1}" = "1" ]; then
  echo "ℹ️ 保留历史静态资源，避免 CDN 缓存切换期出现脚本 404…"
  OLD_TREE=$(mktemp)
  if git fetch --depth=1 "$PUSH_REMOTE" gh-pages 2>/dev/null \
       && git ls-tree -r --name-only FETCH_HEAD > "$OLD_TREE" 2>/dev/null; then
    # 只恢复 _next/static（chunk / css / 字体），体积小且是版本敏感的部分
    grep '^_next/static/' "$OLD_TREE" | while IFS= read -r f; do
      [ -f "$f" ] && continue                      # 新产物已存在同名文件
      mkdir -p "$(dirname "$f")"
      git show "FETCH_HEAD:$f" > "$f" 2>/dev/null || rm -f "$f"
    done
    git add -A
    git -c user.name="${GIT_AUTHOR_NAME:-F-Grze}" -c user.email="${GIT_AUTHOR_EMAIL:-hi@f-grze.dev}" \
      commit -qm "chore: 保留上一版静态资源（CDN 缓存过渡期兜底）" || true
    echo "✅ 历史静态资源已合并"
  else
    echo "⚠️ 未能获取上一版产物，跳过保留步骤（不影响正常发布）"
  fi
  rm -f "$OLD_TREE"
fi

# 产物分支允许强推：避免上一版残留的旧文件与新产物冲突
git push -f "$PUSH_REMOTE" gh-pages

echo "✅ 已推送到 gh-pages"
echo "   仓库 Settings → Pages → Source 选择 gh-pages 分支 / 根目录"
