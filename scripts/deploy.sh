#!/bin/bash
set -e

# md2red 部署脚本
# 由 GitHub Actions CD 或手动执行
# 用法: bash scripts/deploy.sh

DEPLOY_PATH="${DEPLOY_PATH:-/opt/md2red}"
cd "$DEPLOY_PATH"

echo "=== md2red 部署 ==="
echo "路径: $DEPLOY_PATH"
echo "时间: $(date)"

# 1. 拉取最新代码
echo "[1/4] 拉取最新代码..."
git fetch origin main
git reset --hard origin/main

# 2. 安装依赖（仅 lockfile 变化时完整安装）
echo "[2/4] 安装依赖..."
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# 3. 构建
echo "[3/4] 构建项目..."
npm run build

# 4. 验证
echo "[4/4] 验证构建..."
node dist/cli/index.js --version

echo ""
echo "=== 部署完成 ==="
echo "版本: $(node dist/cli/index.js --version)"
echo "时间: $(date)"
