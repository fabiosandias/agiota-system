# syntax=docker/dockerfile:1.4
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/backend/tsconfig.json apps/backend/tsconfig.json
COPY apps/backend/.eslintrc.cjs apps/backend/.eslintrc.cjs

RUN npm install --prefix apps/backend

COPY db ./db
COPY apps/backend ./apps/backend

RUN npm run build --prefix apps/backend

FROM node:20-bookworm-slim AS runner
WORKDIR /app/apps/backend
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/src ./src
COPY --from=builder /app/db /app/db

EXPOSE 3333
CMD ["node", "dist/server.js"]
