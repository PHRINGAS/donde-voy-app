FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY agents ./agents
COPY docker ./docker

ENV NODE_ENV=production
CMD ["npx", "tsx", "agents/src/runner.ts"]
