FROM node:22-alpine@sha256:b74031e546d7f4faf561d797ac1b76beccac856a042815ca77db4fd047581605 AS base
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
