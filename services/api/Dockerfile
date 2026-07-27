FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY src ./src
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci --omit=dev \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    && mkdir -p /var/log/iot-api \
    && chown node:node /var/log/iot-api
COPY src ./src
USER node
CMD ["node", "src/index.js"]
