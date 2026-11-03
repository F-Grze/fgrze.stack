#!/usr/bin/env bash
# 构建纯静态站点（用于 GitHub Pages / 任意静态托管）
#
# 用法：
#   pnpm build:static                                   # 根域名部署
#   BASE_PATH=/<repo> pnpm build:static                 # 仓库子路径部署
#   BASE_PATH=/<repo> pnpm build:static --no-rewrite    # 跳过资源路径重写
#
# 未显式指定 BASE_PATH 时，会从 git remote 自动推断仓库名：
#   仓库名形如 <用户名>.github.io  → 根路径（空 basePath）
#   其他仓库名                     → /<仓库名> 子路径
#
# 产物目录：out/
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_PATH="${BASE_PATH:-}"
NO_REWRITE=0
for arg in "$@"; do
  [ "$arg" = "--no-rewrite" ] && NO_REWRITE=1
done

# 自动推断 basePath（仅在未显式指定时生效）
if [ -z "$BASE_PATH" ]; then
  REMOTE_URL="$(git config --get remote.origin.url 2>/dev/null || true)"
  REPO_NAME=""
  if [ -n "$REMOTE_URL" ]; then
    # 去掉 .git 后缀与结尾斜杠，再取最后一段路径
    REPO_NAME="$(printf '%s' "$REMOTE_URL" | sed -E 's#\.git$##; s#[:/]+$##; s#^.*[:/]+##')"
  fi
  if [ -n "$REPO_NAME" ] && [ "$REPO_NAME" != "github.io" ]; then
    case "$REPO_NAME" in
      *.github.io)
        # 用户主页型仓库 → 落在根路径
        ;;
      *)
        BASE_PATH="/$REPO_NAME"
        ;;
    esac
  fi
fi

export NEXT_PUBLIC_BASE_PATH="$BASE_PATH"

BACKUP_DIR=".static-backup"
rm -rf "$BACKUP_DIR" out
mkdir -p "$BACKUP_DIR"

# 1. 临时移走 API 路由：静态导出不支持 route handler
if [ -d app/api ]; then
  mv app/api "$BACKUP_DIR/api"
fi

# 2. 换用静态配置
cp next.config.ts "$BACKUP_DIR/next.config.ts"
cp next.config.static.ts next.config.ts

# 3. 构建（无论成功失败都要还原）
set +e
pnpm build
BUILD_CODE=$?
set -e

mv "$BACKUP_DIR/next.config.ts" next.config.ts
if [ -d "$BACKUP_DIR/api" ]; then
  mv "$BACKUP_DIR/api" app/api
fi
rmdir "$BACKUP_DIR" 2>/dev/null || true

if [ $BUILD_CODE -ne 0 ]; then
  echo "❌ 构建失败"
  exit $BUILD_CODE
fi

# 4. 子路径部署：给手写的绝对资源路径补前缀（Next 只处理 /_next 与路由）
if [ -n "$BASE_PATH" ] && [ "$NO_REWRITE" -eq 0 ]; then
  node scripts/rewrite-assets.mjs "$BASE_PATH"
fi

# 5. 关闭 Jekyll（GitHub Pages 需要）
touch out/.nojekyll
echo "✅ 静态产物已生成：out/（$(du -sh out | cut -f1)）  basePath=${BASE_PATH:-/}"
