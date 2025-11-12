# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY modules ./modules
COPY shared ./shared
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm --filter @khalistra/frontend... build
RUN pnpm --filter @khalistra/frontend... deploy --prod /out/frontend

FROM node:22-alpine AS runtime
WORKDIR /srv/app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN apk add --no-cache dumb-init curl
COPY --from=build /out/frontend ./
EXPOSE 3000
CMD ["dumb-init", "node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
