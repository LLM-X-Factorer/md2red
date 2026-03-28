FROM node:20-slim

# System deps: Chrome + Xvfb + Chinese fonts
# Use Tencent Cloud mirrors for faster downloads in China
RUN echo "deb https://mirrors.cloud.tencent.com/debian/ bookworm main contrib non-free non-free-firmware" > /etc/apt/sources.list && \
    echo "deb https://mirrors.cloud.tencent.com/debian/ bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.cloud.tencent.com/debian-security bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg2 ca-certificates \
    xvfb \
    fonts-wqy-zenhei \
    libglib2.0-0 libnss3 libnspr4 libdbus-1-3 libatk1.0-0 \
    libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 \
    && wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && dpkg -i ./google-chrome-stable_current_amd64.deb || apt-get install -yf \
    && rm -f google-chrome-stable_current_amd64.deb \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# npm China mirror
RUN npm config set registry https://registry.npmmirror.com

# Install dependencies (layer cache on lockfile)
COPY package.json package-lock.json ./
RUN npm ci

# Build backend
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Build frontend
COPY web/ ./web/
RUN npm run build:web

# Prune dev deps for smaller image
RUN npm prune --omit=dev

VOLUME ["/data"]
ENV CHROME_PATH=/usr/bin/google-chrome

COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["web"]
