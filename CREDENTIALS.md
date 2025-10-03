# Credenciais de Teste - AITRON Financeira

## Usuários do Sistema

Todos os usuários foram criados com endereços completos e podem fazer login no sistema.

### 1. Administrador (Admin)
- **Email**: `admin@aitron.finance`
- **Senha**: `Admin@123`
- **Role**: `admin`
- **Permissões**: Acesso total ao sistema
  - Gerenciar usuários
  - Gerenciar clientes
  - Gerenciar contas financeiras
  - Criar e gerenciar empréstimos
  - Visualizar todos os dados

### 2. Operador (Operator)
- **Email**: `operator@aitron.finance`
- **Senha**: `Operator@123`
- **Role**: `operator`
- **Permissões**: Operação do dia a dia
  - Gerenciar clientes
  - Gerenciar contas financeiras
  - Criar e gerenciar empréstimos
  - Visualizar dados operacionais
  - **NÃO** pode gerenciar usuários do sistema

### 3. Visualizador (Viewer)
- **Email**: `viewer@aitron.finance`
- **Senha**: `Viewer@123`
- **Role**: `viewer`
- **Permissões**: Somente leitura
  - Visualizar clientes
  - Visualizar empréstimos
  - Visualizar dados
  - **NÃO** pode criar, editar ou excluir

## Clientes de Exemplo

O sistema já possui 2 clientes cadastrados para testes:

1. **Carlos Silva**
   - CPF: 123.456.789-01
   - Email: carlos.silva@example.com
   - Telefone: (11) 98765-4001

2. **Ana Santos**
   - CPF: 987.654.321-00
   - Email: ana.santos@example.com
   - Telefone: (11) 98765-4002

## Conta Financeira Padrão

- **Nome**: Caixa Principal
- **Banco**: Banco AITRON
- **Agência**: 0001
- **Conta**: 1234567-8
- **Tipo**: Conta Corrente
- **Saldo Inicial**: R$ 50.000,00
- **Saldo Atual**: R$ 50.000,00

## Acesso ao Sistema

### Frontend (Desenvolvimento)
```
URL: http://localhost:5173
```

### Backend API (Desenvolvimento)
```
URL: http://localhost:3333/api
Health Check: http://localhost:3333/api/health
```

### Swagger/OpenAPI Documentation
```
URL: http://localhost:3333/api/docs
```

### Prisma Studio (Admin de Banco de Dados)
```
Para acessar, execute:
npm run prisma:studio

URL: http://localhost:5555
```

## Banco de Dados

### PostgreSQL
```
Host: localhost
Port: 5433
Database: agiota_db
User: agiota_admin
Password: agiota_pass
```

### Conexão via Docker
```bash
docker exec -it agiota-db psql -U agiota_admin -d agiota_db
```

## Migrações Aplicadas

1. `0001_init` - Estrutura inicial
2. `0002_accounts_installments` - Contas e parcelas
3. `0003_password_reset_tokens` - Reset de senha
4. `0004_structure_update` - Atualização de estrutura
5. `0005_refresh_tokens` - Tokens de refresh para JWT
6. `0006_remove_legacy_client_fields` - Remoção de campos legados (cpf, address)

## Como Iniciar o Sistema

### Desenvolvimento Local

1. **Iniciar apenas o banco de dados:**
   ```bash
   docker-compose up -d db
   ```

2. **Aplicar migrações:**
   ```bash
   npm run prisma:migrate
   ```

3. **Executar seed (popular dados de teste):**
   ```bash
   npm run seed
   ```

4. **Iniciar backend:**
   ```bash
   npm run dev:backend
   ```

5. **Iniciar frontend (em outro terminal):**
   ```bash
   npm run dev:frontend
   ```

### Usando Docker Compose (Produção)

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## Recursos Implementados

### ✅ Autenticação e Autorização
- Login com JWT (access + refresh token)
- Tokens em cookies httpOnly
- Controle de acesso baseado em roles (RBAC)
- Reset de senha por email
- Guards de UI condicionais por role

### ✅ Gerenciamento de Usuários
- CRUD completo com paginação
- Busca e filtros
- Um endereço por usuário (integração ViaCEP)
- Três níveis de permissão (admin, operator, viewer)

### ✅ Gerenciamento de Clientes
- CRUD completo com paginação
- Busca global e filtros avançados
- Múltiplos endereços por cliente
- Integração com ViaCEP
- Validação de CPF/CNPJ

### ✅ Gerenciamento de Contas Financeiras
- CRUD completo com paginação
- Filtros por tipo de conta
- Saldo inicial e atual
- Display de saldo total no header
- Botão para ocultar/mostrar saldo

### ✅ Código e Qualidade
- ESLint configurado (frontend + backend)
- Prettier configurado
- TypeScript strict mode
- Prisma ORM
- Migrations versionadas
- Seeds para dados de teste

## Observações Importantes

1. **Segurança**: As senhas fornecidas são apenas para ambiente de desenvolvimento/teste
2. **Email**: O envio de emails está configurado mas requer credenciais SMTP válidas no `.env`
3. **Refresh Token**: Configurado com expiração de 7 dias
4. **Access Token**: Configurado com expiração de 15 minutos
5. **Rate Limiting**: 100 requisições por 15 minutos por IP
