# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# VComm ERP — multi-stage build
# Stage 1 (build): cài deps + build client (vite) + bundle server (esbuild CJS)
# Stage 2 (run):   node:22-slim chỉ chứa dist + node_modules production
# ---------------------------------------------------------------------------

FROM node:22-slim AS build
WORKDIR /app

# Tận dụng layer cache: chỉ cài lại khi package*.json thay đổi
COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Chỉ copy artifacts cần thiết để giảm attack surface & kích thước image
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

# Liveness/readiness dùng /health + /ready (thêm ở server.ts, GĐ1)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.cjs"]
