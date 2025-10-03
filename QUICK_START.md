# 🚀 Guia Rápido - AITRON Financeira

## Iniciar TUDO com Docker (1 comando!)

```bash
docker-compose up -d
```

Pronto! Aguarde 30 segundos e acesse:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3333/api
- **Health Check**: http://localhost:3333/api/health

## Login

Use qualquer um destes usuários:

| Email | Senha | Permissão |
|-------|-------|-----------|
| `admin@aitron.finance` | `Admin@123` | Administrador (acesso total) |
| `operator@aitron.finance` | `Operator@123` | Operador (sem gerenciar usuários) |
| `viewer@aitron.finance` | `Viewer@123` | Visualizador (somente leitura) |

## Ver Logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend  
docker-compose logs -f frontend
```

## Parar Tudo

```bash
# Parar (mantém dados)
docker-compose down

# Parar e APAGAR TODOS OS DADOS
docker-compose down -v
```

## Problemas?

```bash
# Reconstruir tudo
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ver status
docker-compose ps

# Ver recursos
docker stats
```

## Mais Informações

Veja [CREDENTIALS.md](./CREDENTIALS.md) para documentação completa.
