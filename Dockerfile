FROM node:20-slim

# Install Chrome + Xvfb + Chinese fonts
RUN apt-get update && apt-get install -y \
    wget gnupg2 \
    xvfb \
    fonts-noto-cjk fonts-noto-cjk-extra \
    && wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm -f google-chrome-stable_current_amd64.deb \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Playwright system deps
RUN npx playwright install-deps chromium 2>/dev/null || true

WORKDIR /app

# Install dependencies (layer cache)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Data volumes
VOLUME ["/data"]

# Default env
ENV MD2RED_DATA_DIR=/data
ENV CHROME_PATH=/usr/bin/google-chrome

# Wrapper script for xvfb
COPY scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["--help"]
