FROM node:20-slim

# System deps: Chromium dependencies + Chinese fonts
RUN echo "deb http://mirrors.cloud.tencent.com/debian/ bookworm main contrib non-free non-free-firmware" > /etc/apt/sources.list && \
    echo "deb http://mirrors.cloud.tencent.com/debian/ bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.cloud.tencent.com/debian-security bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    apt-get update && apt-get install -y --no-install-recommends \
    fonts-wqy-zenhei \
    libglib2.0-0 libnss3 libnspr4 libdbus-1-3 libatk1.0-0 \
    libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# npm China mirror
RUN npm config set registry https://registry.npmmirror.com

# Install dependencies (cached unless package-lock.json changes)
COPY package.json package-lock.json ./
RUN npm ci

# Install Playwright Chromium (headless only, no Chrome/Xvfb needed)
RUN npx playwright install chromium

# --- Source code layers (busted by CACHE_BUST arg) ---
ARG CACHE_BUST=1
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

COPY web/ ./web/
RUN npm run build:web

# Prune dev deps
RUN npm prune --omit=dev

# Entrypoint
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

VOLUME ["/data"]

EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["web"]
