FROM node:22-alpine@sha256:b74031e546d7f4faf561d797ac1b76beccac856a042815ca77db4fd047581605 AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    && mkdir -p /var/log/iot-simulator \
    && chown node:node /var/log/iot-simulator
COPY src ./src
USER node
CMD ["node", "src/index.js"]
