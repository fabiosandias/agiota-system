# syntax=docker/dockerfile:1.4
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de configuração do root
COPY package.json package-lock.json tsconfig.base.json ./
COPY db ./db

# Copiar package.json dos workspaces
COPY apps/backend/package.json apps/backend/package.json
COPY apps/backend/tsconfig.json apps/backend/tsconfig.json
COPY apps/backend/.eslintrc.cjs apps/backend/.eslintrc.cjs

# Instalar dependências no root (para workspaces)
RUN npm ci

# Copiar código do backend
COPY apps/backend ./apps/backend

# Gerar Prisma Client
RUN npx prisma generate --schema ./db/prisma/schema.prisma

# Build do backend
WORKDIR /app/apps/backend
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copiar node_modules do root (contém Prisma Client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copiar backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

# Copiar schema do Prisma
COPY --from=builder /app/db ./db

WORKDIR /app/apps/backend

EXPOSE 3333
CMD ["node", "dist/server.js"]
