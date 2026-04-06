#!/bin/bash
set -e

# md2red 服务器初始化脚本
# 在全新的 Ubuntu 22.04 上运行一次即可
# 用法: bash scripts/setup-server.sh

echo "=== md2red 服务器初始化 ==="

# 1. 系统更新
echo "[1/4] 更新系统..."
apt update && apt upgrade -y

# 2. 安装 Node.js 20
echo "[2/4] 安装 Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node.js $(node --version)"

# 3. 安装中文字体 + Playwright 依赖
echo "[3/4] 安装中文字体和 Playwright 依赖..."
apt install -y fonts-noto-cjk fonts-noto-cjk-extra
npx playwright install-deps chromium 2>/dev/null || true

# 4. 创建项目目录
DEPLOY_PATH="${1:-/opt/md2red}"
echo "[4/4] 初始化项目目录: $DEPLOY_PATH"
mkdir -p "$DEPLOY_PATH"
mkdir -p ~/.md2red

echo ""
echo "=== 初始化完成 ==="
echo ""
echo "下一步："
echo "  1. 部署项目代码"
echo "     cd $DEPLOY_PATH && git clone https://github.com/LLM-X-Factorer/md2red.git ."
echo "     npm install && npx playwright install chromium && npm run build:all"
echo ""
echo "  2. 启动 Web 控制台"
echo "     npm run start:web"
