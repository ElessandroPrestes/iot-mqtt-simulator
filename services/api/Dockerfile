FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY src ./src
CMD ["npm", "run", "dev"]

FROM base AS production
RUN npm ci --omit=dev
COPY src ./src
USER node
CMD ["node", "src/index.js"]
