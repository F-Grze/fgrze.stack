#!/usr/bin/env bash
# 把 out/ 推送到 GitHub Pages（gh-pages 分支）
# 用法：./scripts/deploy-gh-pages.sh git@github.com:<user>/<repo>.git
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE="${1:-}"
if [ -z "$REMOTE" ]; then
  echo "用法: $0 <git-remote-url>"
  exit 1
fi

bash scripts/build-static.sh
cd out
git init -q
git add -A
git commit -qm "deploy: $(date '+%Y-%m-%d %H:%M')"
git branch -M gh-pages
git remote add origin "$REMOTE" 2>/dev/null || git remote set-url origin "$REMOTE"
git push -f origin gh-pages
echo "✅ 已推送到 gh-pages，去仓库 Settings → Pages 选择 gh-pages 分支即可"
