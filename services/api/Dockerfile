FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS base
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
