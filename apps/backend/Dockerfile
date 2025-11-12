# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN apk add --no-cache python3 make g++
WORKDIR /app
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY modules ./modules
COPY shared ./shared
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @khalistra/backend build
RUN pnpm deploy --filter @khalistra/backend --prod /out/backend

FROM node:22-alpine AS runtime
WORKDIR /srv/app
ENV NODE_ENV=production
ENV PORT=3001
RUN apk add --no-cache dumb-init curl
COPY --from=build /out/backend ./
RUN mkdir -p node_modules/@khalistra \
  && rm -rf node_modules/@khalistra/game-engine \
  && ln -s /srv/app/dist/modules/game-engine/src node_modules/@khalistra/game-engine
EXPOSE 3001
CMD ["dumb-init", "node", "dist/apps/backend/src/main.js"]
