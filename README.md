# Agiota System

Single-user loan management platform featuring React 19 + Tailwind frontend, Express/Prisma backend, and PostgreSQL database. This repository is organised as a monorepo (`apps/frontend`, `apps/backend`) and ships with Docker tooling for an end-to-end experience.

## 1. Requisitos

- Node.js 20+ and npm (for local development without Docker)
- Docker 24+ and Docker Compose plugin
- Make a copy of `.env.example` into `.env` and adjust values as needed (default credentials work for local + Docker usage)

## 2. Desenvolvimento local (sem Docker)

1. Install dependencies:
   ```bash
   npm install
   npm --workspace apps/backend run prisma:generate
   ```
2. Start PostgreSQL (either via Docker `docker compose up db` or a local instance that matches `DATABASE_URL`).
3. Apply migrations and seed the admin user:
   ```bash
   npm run prisma:migrate
   npm run seed
   ```
4. Run both apps:
   ```bash
   npm run dev
   ```
   - Frontend → http://localhost:5173
   - Backend API → http://localhost:3333/api

## 3. Executando tudo com Docker

1. Ensure `.env` exists (copy from `.env.example` if necessary).
2. Build and start the stack:
   ```bash
   docker compose up --build
   ```
   - PostgreSQL listens on `localhost:5433`
   - Backend listens on `http://localhost:3333`
   - Frontend Vite preview listens on `http://localhost:5173`
   - Prisma Studio (database UI) available at `http://localhost:5555` when the `studio` service is up
3. The backend container automatically runs database migrations and seeds the default administrator on start. Logs for the three services are streamed to your terminal; press `Ctrl+C` to stop.
4. To rebuild after code changes:
   ```bash
   docker compose build backend frontend
   docker compose up
   ```

## 4. Credenciais padrão

- Email: `admin@agiota.local`
- Password: `Agiota@123`

## 5. Comandos úteis

- `npm run prisma:migrate` – Apply pending migrations (uses Prisma schema in `db/prisma`).
- `npm run prisma:generate` – Regenerate Prisma client types.
- `npm run lint` – Run ESLint on both backend and frontend workspaces.
- `docker compose logs backend -f` – Tail backend logs when running in Docker.
- `docker compose up studio` – Launch Prisma Studio UI (`http://localhost:5555`).
- `docker compose exec backend npm run prisma:generate` – Rebuild Prisma client inside containers if schema changes.

## 6. Autenticação e tokens

- O login (`/api/auth/login`) devolve um token JWT e dados do usuário. O frontend armazena o token em `localStorage` e todas as chamadas à API são autenticadas via header `Authorization: Bearer <token>`.
- Há rotas para perfil (`/api/auth/me`, `/api/users/me`), troca de senha (`/api/users/me/password`) e logout (`/api/auth/logout`).
- Documentação interativa da API disponível em `http://localhost:3333/api/docs` (Swagger UI).

## 7. Recuperação de senha via Gmail SMTP

Configure as variáveis a seguir (já presentes em `.env.example`) com um App Password do Google:

```
APP_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-app-google
SMTP_FROM=seu-email@gmail.com
```

As rotas `/api/auth/forgot-password` e `/api/auth/reset-password` enviam e validam os links de recuperação. A interface web possui telas de "Esqueci minha senha" e "Definir nova senha".

## 8. Solução de problemas

- **npm registry timeouts**: if `npm install` fails with `EAI_AGAIN`, double-check network/DNS connectivity. Configure a proxy or alternate registry if you are behind a firewall.
- **Database connection errors inside Docker**: confirm that the `db` service is healthy (`docker compose ps`) and that the backend container sees `DATABASE_URL=...@db:5432/...` (set in `docker-compose.yml`).
- **Port conflicts**: ensure ports `3333`, `5173`, and `5433` are free or adjust the port mappings in `docker-compose.yml` and `.env` accordingly.

Bons desenvolvimentos!
