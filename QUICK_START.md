# 🚀 Guia Rápido - AITRON Financeira (Multi-Tenant)

## ⚡ Iniciar TUDO com Docker (1 comando!)

```bash
docker-compose up -d
```

**O que acontece automaticamente:**
1. ✅ PostgreSQL iniciado
2. ✅ Schema do banco criado (Prisma db push)
3. ✅ **Seed executado** - Usuários e dados iniciais criados
4. ✅ Backend API rodando
5. ✅ Frontend React rodando
6. ✅ Prisma Studio disponível

Aguarde 30-40 segundos e acesse:

- **Frontend (Tenant)**: http://localhost:5173
- **Backend API**: http://localhost:3333/api
- **Swagger/API Docs**: http://localhost:3333/api/docs
- **Prisma Studio**: http://localhost:5555
- **Health Check**: http://localhost:3333/api/health

---

## 🔐 Credenciais de Acesso

### **Super Admins (AITRON)** - Login via `/admin/login`
Gerenciam todos os tenants, relatórios, suporte.

| Email | Senha | Função |
|-------|-------|--------|
| `fabio@aitron.com.br` | `SuperAdmin@123` | Super Admin Principal |
| `suporte@aitron.com.br` | `Suporte@123` | Super Admin de Suporte |

### **Tenant Admin (Cliente Exemplo)** - Login via `/login`
Usuário do cliente/tenant "Empresa Exemplo".

| Email | Senha | Tenant | Role |
|-------|-------|--------|------|
| `fabiowebmain@gmail.com` | `Admin@123` | Empresa Exemplo | admin |

---

## 📚 Documentação da API (Swagger)

Acesse: http://localhost:3333/api/docs

**Tags disponíveis:**
- **Auth (Tenant)** - Login de usuários do tenant
- **Auth (Admin)** - Login de Super Admins
- **Tenants (Admin)** - CRUD de tenants (Super Admin apenas)
- **Clients** - Gerenciamento de clientes (por tenant)
- **Users** - Gerenciamento de usuários (por tenant)
- **Accounts** - Contas bancárias (por tenant)
- **Loans** - Empréstimos (por tenant)
- **Utils** - CEP, etc.

**Exemplos de Teste no Swagger:**
1. Use `POST /auth/login` ou `POST /admin/auth/login`
2. Copie o `token` da resposta
3. Clique em "Authorize" (🔒) no topo
4. Cole: `Bearer <seu-token>`
5. Teste qualquer rota protegida

---

## 🛠️ Comandos Úteis

### Ver Logs
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend

# Últimas 50 linhas do backend
docker logs agiota-backend --tail 50
```

### Parar/Reiniciar
```bash
# Parar (mantém dados)
docker-compose down

# Parar e APAGAR TODOS OS DADOS
docker-compose down -v

# Reiniciar apenas backend
docker-compose restart backend

# Reiniciar tudo
docker-compose restart
```

### Acessar Container
```bash
# Shell no backend
docker exec -it agiota-backend sh

# Shell no banco
docker exec -it agiota-db psql -U agiota_admin -d agiota_db

# Ver processos
docker-compose ps
```

### Banco de Dados

**Rodar seed manualmente** (caso precise recriar usuários):
```bash
# Dentro do container backend
docker exec -it agiota-backend npm run seed

# Ou localmente (se tiver Node.js)
npm run seed
```

**Resetar banco** (CUIDADO - apaga tudo!):
```bash
docker exec agiota-db psql -U agiota_admin -d agiota_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker-compose restart backend
```

**Acessar Prisma Studio:**
- Navegador: http://localhost:5555
- Visualize e edite dados diretamente

---

## 🐛 Problemas Comuns

### 1. "Port already in use"
```bash
# Descobrir o que está usando a porta
sudo lsof -i :3333
sudo lsof -i :5173

# Matar processo
sudo kill -9 <PID>

# Ou usar portas diferentes no .env
PORT=3334
VITE_PORT=5174
```

### 2. Backend não sobe / Erro no Prisma
```bash
# Reconstruir tudo do zero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Ver logs detalhados
docker logs agiota-backend -f
```

### 3. Sem dados no banco
```bash
# Verificar se seed rodou
docker logs agiota-backend | grep "Seed concluído"

# Rodar seed manualmente
docker exec -it agiota-backend npm run seed
```

### 4. Swagger não carrega
```bash
# Verificar se backend está rodando
curl http://localhost:3333/api/health

# Se não responder, ver logs
docker logs agiota-backend --tail 100
```

### 5. Frontend não conecta na API
```bash
# Verificar variável de ambiente
docker exec agiota-frontend env | grep VITE_API_URL
# Deve ser: VITE_API_URL=http://localhost:3333/api

# Reconstruir frontend
docker-compose up -d --build frontend
```

---

## 🔄 Fluxo Completo de Reset

Para começar 100% do zero:

```bash
# 1. Parar e remover tudo
docker-compose down -v

# 2. (Opcional) Limpar imagens antigas
docker system prune -a

# 3. Rebuild
docker-compose build --no-cache

# 4. Subir tudo
docker-compose up -d

# 5. Aguardar e verificar
sleep 40
curl http://localhost:3333/api/health
```

---

## 📊 Verificar Status

```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Health check
curl http://localhost:3333/api/health

# Testar login Super Admin
curl -X POST http://localhost:3333/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fabio@aitron.com.br","password":"SuperAdmin@123"}' \
  | jq .

# Testar login Tenant
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fabiowebmain@gmail.com","password":"Admin@123"}' \
  | jq .
```

---

## 📖 Mais Informações

- **Documentação Completa**: [README.md](./README.md)
- **PRD (Requisitos)**: [docs/PRD.md](./docs/PRD.md)
- **Status do Projeto**: [STATUS.md](./STATUS.md)
- **Credenciais**: [CREDENTIALS.md](./CREDENTIALS.md)

---

## 🎯 Próximos Passos

Após logar:

### Como **Super Admin**:
1. Acesse http://localhost:5173/admin/login
2. Login: `fabio@aitron.com.br` / `SuperAdmin@123`
3. Gerencie tenants, veja relatórios, responda tickets

### Como **Tenant**:
1. Acesse http://localhost:5173/login
2. Login: `fabiowebmain@gmail.com` / `Admin@123`
3. Gerencie clientes, empréstimos, usuários do seu tenant

---

**Precisa de ajuda?** Abra uma issue no repositório ou entre em contato com a equipe.
