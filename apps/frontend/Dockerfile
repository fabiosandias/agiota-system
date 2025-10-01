# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:3333/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/frontend/tsconfig.json apps/frontend/tsconfig.json
COPY apps/frontend/tsconfig.node.json apps/frontend/tsconfig.node.json
COPY apps/frontend/vite.config.ts apps/frontend/vite.config.ts
COPY apps/frontend/tailwind.config.ts apps/frontend/tailwind.config.ts
COPY apps/frontend/postcss.config.cjs apps/frontend/postcss.config.cjs

RUN npm install --prefix apps/frontend

COPY apps/frontend ./apps/frontend

RUN npm run build --prefix apps/frontend

FROM node:20-alpine AS runner
WORKDIR /app/apps/frontend
ENV NODE_ENV=production

ARG VITE_API_URL=http://localhost:3333/api
ENV VITE_API_URL=$VITE_API_URL

COPY --from=builder /app/apps/frontend/package.json ./package.json
COPY --from=builder /app/apps/frontend/node_modules ./node_modules
COPY --from=builder /app/apps/frontend/dist ./dist

EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
