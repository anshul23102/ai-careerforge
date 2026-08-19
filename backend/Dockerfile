# Build context is the monorepo root (see render.yaml's dockerContext) —
# this backend depends on packages/parsers and packages/shared via npm
# workspaces, both of which need to be built and available at runtime.

FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# The root package.json declares "frontend" as a workspace too — npm ci
# needs every declared workspace's manifest present, even though the
# backend image never uses the frontend's source or dependencies.
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY packages/parsers/package.json packages/parsers/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY packages/shared packages/shared
COPY packages/parsers packages/parsers
COPY backend backend
RUN npm run build:packages
WORKDIR /app/backend
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
# System Chromium for puppeteer-core (headless portfolio rendering) — a real
# apt package rather than puppeteer's bundled download, keeping the image
# smaller and the build faster.
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY packages/parsers/package.json packages/parsers/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/parsers/dist packages/parsers/dist
COPY --from=build /app/backend/dist backend/dist

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "dist/index.js"]
