#!/bin/bash
set -e

# md2red 服务器初始化脚本
# 在全新的 Ubuntu 22.04 Lighthouse 上运行一次即可
# 用法: bash scripts/setup-server.sh

echo "=== md2red 服务器初始化 ==="

# 1. 系统更新
echo "[1/6] 更新系统..."
apt update && apt upgrade -y

# 2. 安装 Node.js 20
echo "[2/6] 安装 Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node.js $(node --version)"

# 3. 安装 Google Chrome
echo "[3/6] 安装 Google Chrome..."
if ! command -v google-chrome &> /dev/null; then
  wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
  apt install -y ./google-chrome-stable_current_amd64.deb || apt --fix-broken install -y
  rm -f google-chrome-stable_current_amd64.deb
fi
echo "Chrome $(google-chrome --version)"

# 4. 安装 Xvfb + 中文字体
echo "[4/6] 安装 Xvfb 和中文字体..."
apt install -y xvfb fonts-noto-cjk fonts-noto-cjk-extra

# 5. 安装 Playwright 浏览器依赖
echo "[5/6] 安装 Playwright 系统依赖..."
npx playwright install-deps chromium 2>/dev/null || true

# 6. 创建项目目录
DEPLOY_PATH="${1:-/opt/md2red}"
echo "[6/6] 初始化项目目录: $DEPLOY_PATH"
mkdir -p "$DEPLOY_PATH"

# 创建 md2red 数据目录
mkdir -p ~/.md2red

echo ""
echo "=== 初始化完成 ==="
echo ""
echo "下一步："
echo "  1. 将项目代码部署到 $DEPLOY_PATH"
echo "     cd $DEPLOY_PATH && git clone https://github.com/LLM-X-Factorer/md2red.git ."
echo "     npm install && npm run build"
echo ""
echo "  2. 登录小红书"
echo "     cd $DEPLOY_PATH && xvfb-run node dist/cli/index.js auth serve --port 9876"
echo "     # 用手机浏览器打开 http://服务器IP:9876 扫码"
echo ""
echo "  3. 设置 Cookie 健康监控 (可选)"
echo "     crontab -e"
echo "     0 */12 * * * cd $DEPLOY_PATH && node dist/cli/index.js health --notify"
