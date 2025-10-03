# 🗄️ Diagrama do Banco de Dados - AITRON Financeira Multi-Tenant

## 📊 Visão Geral da Estrutura

```
┌──────────────────────────────────────────────────────────────────────┐
│                         NÍVEL SYSTEM                                 │
│                    (Gerenciado pela AITRON)                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  users (tenantId = NULL)                                    │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: uuid (PK)                                             │   │
│  │  email: "fabio@aitron.com.br"                             │   │
│  │  role: "super_admin"                                       │   │
│  │  tenantId: NULL  ← SEM TENANT!                            │   │
│  │  passwordHash: ...                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  👑 Super Admins:                                                   │
│  - fabio@aitron.com.br / SuperAdmin@123                            │
│  - suporte@aitron.com.br / Suporte@123                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               │ cria e gerencia
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        NÍVEL TENANT                                  │
│                   (Empresas Clientes da AITRON)                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  tenants                                                    │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: "tenant-uuid-1" (PK)                                  │   │
│  │  name: "Empresa Exemplo"                                   │   │
│  │  email: "exemplo@empresa.com.br"                           │   │
│  │  cpfCnpj: "12345678000190"                                 │   │
│  │  plan: "pro" | "free"                                      │   │
│  │  status: "active" | "past_due" | "suspended" | "canceled"  │   │
│  │  trialStartAt: 2025-10-01                                  │   │
│  │  trialEndAt: 2025-10-16 (15 dias)                         │   │
│  │  nextDueAt: 2025-11-01                                     │   │
│  │  billingMethod: "pix" | "credit_card"                      │   │
│  │  addressId: uuid (FK → addresses)                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               │ tem                                  │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  subscription_invoices                                      │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: uuid (PK)                                             │   │
│  │  tenantId: "tenant-uuid-1" (FK → tenants)                 │   │
│  │  periodStart: 2025-10-01                                   │   │
│  │  periodEnd: 2025-10-31                                     │   │
│  │  dueDate: 2025-11-05                                       │   │
│  │  amount: 49.90                                             │   │
│  │  method: "pix"                                             │   │
│  │  status: "open" | "paid" | "overdue" | "canceled"         │   │
│  │  paidAt: null                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  subscription_events                                        │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: uuid (PK)                                             │   │
│  │  tenantId: "tenant-uuid-1" (FK → tenants)                 │   │
│  │  type: "trial_started" | "payment_succeeded" |             │   │
│  │        "payment_failed" | "account_suspended"              │   │
│  │  data: { ... } (JSONB)                                     │   │
│  │  createdAt: timestamp                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               │ tem
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NÍVEL USUÁRIOS DO TENANT                          │
│              (Equipe que trabalha na Empresa Exemplo)               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  users (tenantId = "tenant-uuid-1")                        │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: "user-uuid-1" (PK)                                    │   │
│  │  tenantId: "tenant-uuid-1" (FK → tenants) ← COM TENANT!   │   │
│  │  email: "fabiowebmain@gmail.com"                           │   │
│  │  role: "admin" | "operator" | "viewer"                     │   │
│  │  name: "Fabio Web"                                         │   │
│  │  passwordHash: ...                                         │   │
│  │  addressId: uuid (FK → addresses)                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Exemplo de usuários:                                               │
│  • Admin: fabiowebmain@gmail.com (cria tudo)                       │
│  • Operator: operador@empresa.com (cria clientes/empréstimos)      │
│  • Viewer: viewer@empresa.com (apenas lê)                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               │ cadastra e gerencia
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      NÍVEL CLIENTES                                  │
│            (Pessoas que PEGAM empréstimos - NÃO fazem login)       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  clients                                                    │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: "client-uuid-1" (PK)                                  │   │
│  │  tenantId: "tenant-uuid-1" (FK → tenants)                 │   │
│  │  name: "João da Silva"                                     │   │
│  │  firstName: "João"                                         │   │
│  │  lastName: "Silva"                                         │   │
│  │  email: "joao@email.com"                                   │   │
│  │  document: "12345678900"                                   │   │
│  │  documentType: "cpf" | "cnpj"                              │   │
│  │  phone: "11999998888"                                      │   │
│  │  birthDate: 1990-05-15                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               │ tem                                  │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  addresses (para clients)                                   │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: uuid (PK)                                             │   │
│  │  clientId: "client-uuid-1" (FK → clients)                 │   │
│  │  userId: NULL                                              │   │
│  │  postalCode: "01310100"                                    │   │
│  │  street: "Av. Paulista"                                    │   │
│  │  number: "1578"                                            │   │
│  │  district: "Bela Vista"                                    │   │
│  │  city: "São Paulo"                                         │   │
│  │  state: "SP"                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               │ recebe
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NÍVEL EMPRÉSTIMOS                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  accounts (contas bancárias do tenant)                     │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: "account-uuid-1" (PK)                                 │   │
│  │  tenantId: "tenant-uuid-1" (FK → tenants)                 │   │
│  │  userId: "user-uuid-1" (FK → users)                       │   │
│  │  name: "Conta Principal"                                   │   │
│  │  bankName: "Banco do Brasil"                               │   │
│  │  type: "checking" | "savings"                              │   │
│  │  currentBalance: 100000.00                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               │ financia                             │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  loans                                                      │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: "loan-uuid-1" (PK)                                    │   │
│  │  tenantId: "tenant-uuid-1" (FK → tenants)                 │   │
│  │  clientId: "client-uuid-1" (FK → clients)                 │   │
│  │  accountId: "account-uuid-1" (FK → accounts)              │   │
│  │  createdByUserId: "user-uuid-1" (FK → users)              │   │
│  │  principalAmount: 5000.00                                  │   │
│  │  interestRate: 5.5                                         │   │
│  │  dueDate: 2025-12-01                                       │   │
│  │  status: "active" | "overdue" | "paid" | "written_off"    │   │
│  │  notes: "Empréstimo para capital de giro"                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               │ dividido em                          │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  loan_installments                                          │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: uuid (PK)                                             │   │
│  │  loanId: "loan-uuid-1" (FK → loans)                       │   │
│  │  sequence: 1, 2, 3...                                      │   │
│  │  dueDate: 2025-11-01, 2025-12-01...                       │   │
│  │  principalDue: 1666.67                                     │   │
│  │  interestDue: 91.67                                        │   │
│  │  totalDue: 1758.34                                         │   │
│  │  paidAmount: 0.00                                          │   │
│  │  status: "pending" | "paid" | "overdue"                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               │ recebe                               │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  payments                                                   │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: uuid (PK)                                             │   │
│  │  loanId: "loan-uuid-1" (FK → loans)                       │   │
│  │  accountId: "account-uuid-1" (FK → accounts)              │   │
│  │  amount: 1758.34                                           │   │
│  │  paymentDate: 2025-11-05                                   │   │
│  │  type: "installment" | "early" | "late"                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               │ associado a                          │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  installment_payments                                       │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  installmentId: uuid (FK → loan_installments)              │   │
│  │  paymentId: uuid (FK → payments)                           │   │
│  │  amount: 1758.34                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  account_transactions                                       │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  id: uuid (PK)                                             │   │
│  │  accountId: "account-uuid-1" (FK → accounts)              │   │
│  │  loanId: "loan-uuid-1" (FK → loans) [opcional]            │   │
│  │  paymentId: uuid (FK → payments) [opcional]                │   │
│  │  direction: "credit" | "debit"                             │   │
│  │  amount: 5000.00                                           │   │
│  │  description: "Empréstimo concedido para João"            │   │
│  │  occurredAt: timestamp                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Relacionamentos Principais

```
users (tenantId = NULL)  ← SUPER ADMIN
    ↓ cria e gerencia
tenants
    ↓ tem
    ├─→ users (tenantId = uuid)  ← USUÁRIOS DO TENANT
    ├─→ clients (tenantId = uuid)  ← CLIENTES
    ├─→ accounts (tenantId = uuid)  ← CONTAS
    ├─→ loans (tenantId = uuid)  ← EMPRÉSTIMOS
    ├─→ subscription_invoices
    ├─→ subscription_events
    └─→ tickets

clients
    ↓ recebe
loans
    ↓ dividido em
loan_installments
    ↓ recebe
payments → installment_payments
```

---

## 📋 Tabela de Referência Rápida

| Tabela | tenantId? | Quem cria? | Exemplo |
|--------|-----------|------------|---------|
| **users** (super_admin) | ❌ NULL | Sistema (seed) | fabio@aitron.com.br |
| **tenants** | - | Super Admin | Empresa Exemplo |
| **users** (tenant) | ✅ UUID | Super Admin ou Tenant Admin | fabiowebmain@gmail.com |
| **clients** | ✅ UUID | Usuários do Tenant | João da Silva |
| **accounts** | ✅ UUID | Usuários do Tenant | Conta Principal |
| **loans** | ✅ UUID | Usuários do Tenant | Empréstimo #001 |
| **loan_installments** | ❌ (herda do loan) | Sistema automático | Parcela 1/12 |
| **payments** | ❌ (herda do loan) | Usuários do Tenant | Pagamento R$ 1.758,34 |
| **subscription_invoices** | ✅ UUID | Sistema (cron) | Fatura Out/2025 |
| **subscription_events** | ✅ UUID | Sistema | trial_started |
| **tickets** | ✅ UUID | Usuários do Tenant | Ticket #001 |
| **ticket_messages** | ❌ (herda do ticket) | Tenant ou Super Admin | "Preciso de ajuda..." |

---

## 🎯 Exemplos Práticos de Queries

### 1️⃣ Super Admin busca TODOS os tenants
```sql
SELECT * FROM tenants;
-- ✅ Retorna TODOS (sem filtro de tenantId)
```

### 2️⃣ Usuário Tenant busca clientes
```sql
-- Token contém: tenantId = "tenant-uuid-1"
SELECT * FROM clients WHERE tenantId = 'tenant-uuid-1';
-- ✅ Retorna APENAS clientes do seu tenant
```

### 3️⃣ Usuário Tenant busca empréstimos
```sql
SELECT
  l.*,
  c.name as client_name,
  a.name as account_name
FROM loans l
JOIN clients c ON l.clientId = c.id
JOIN accounts a ON l.accountId = a.id
WHERE l.tenantId = 'tenant-uuid-1';
-- ✅ Empréstimos + Clientes + Contas do MESMO tenant
```

### 4️⃣ Criar empréstimo (com auditoria)
```sql
INSERT INTO loans (
  id, tenantId, clientId, accountId, createdByUserId,
  principalAmount, interestRate, dueDate, status
) VALUES (
  uuid_generate_v4(),
  'tenant-uuid-1',  -- ← Tenant do usuário
  'client-uuid-1',   -- ← Cliente do tenant
  'account-uuid-1',  -- ← Conta do tenant
  'user-uuid-1',     -- ← Quem criou (auditoria)
  5000.00,
  5.5,
  '2025-12-01',
  'active'
);
```

---

## 🔒 Constraints de Segurança

### ✅ Garantias do Banco

1. **Isolamento por Tenant:**
```sql
-- Índices para performance
CREATE INDEX idx_clients_tenant ON clients(tenantId);
CREATE INDEX idx_loans_tenant ON loans(tenantId);
CREATE INDEX idx_accounts_tenant ON accounts(tenantId);
```

2. **Integridade Referencial:**
```sql
-- Cliente deve pertencer ao mesmo tenant do empréstimo
ALTER TABLE loans
  ADD CONSTRAINT fk_loan_client_tenant
  CHECK (
    (SELECT tenantId FROM clients WHERE id = clientId) = tenantId
  );
```

3. **Usuários Super Admin:**
```sql
-- Super Admin NÃO tem tenant
ALTER TABLE users
  ADD CONSTRAINT chk_super_admin_no_tenant
  CHECK (
    (role = 'super_admin' AND tenantId IS NULL) OR
    (role != 'super_admin' AND tenantId IS NOT NULL)
  );
```

---

## 📊 Exemplo Completo: Tenant "Empresa Exemplo"

```
TENANT: Empresa Exemplo (tenant-uuid-1)
  │
  ├─ USUÁRIOS (fazem login)
  │  ├─ fabiowebmain@gmail.com (admin)
  │  ├─ operador@empresa.com (operator)
  │  └─ viewer@empresa.com (viewer)
  │
  ├─ CONTAS BANCÁRIAS
  │  ├─ Conta Principal (R$ 100.000,00)
  │  └─ Conta Reserva (R$ 50.000,00)
  │
  ├─ CLIENTES (NÃO fazem login)
  │  ├─ João da Silva (CPF: 123.456.789-00)
  │  │  └─ Empréstimos:
  │  │     ├─ R$ 5.000 (3x) - Status: active
  │  │     └─ R$ 2.000 (12x) - Status: paid
  │  │
  │  ├─ Maria Oliveira (CPF: 987.654.321-00)
  │  │  └─ Empréstimos:
  │  │     └─ R$ 10.000 (6x) - Status: overdue
  │  │
  │  └─ Empresa XYZ Ltda (CNPJ: 12.345.678/0001-90)
  │     └─ Empréstimos:
  │        └─ R$ 50.000 (24x) - Status: active
  │
  └─ ASSINATURA
     ├─ Plano: PRO (R$ 49,90/mês)
     ├─ Status: active
     ├─ Trial: 15 dias (já expirado)
     ├─ Próximo vencimento: 01/11/2025
     └─ Método: PIX
```

---

## ✅ Checklist de Entendimento

Responda mentalmente:

- [ ] Entendo que **Super Admin NÃO tem tenantId**
- [ ] Entendo que **Usuários do Tenant TÊM tenantId**
- [ ] Entendo que **Clientes NÃO fazem login** (apenas cadastrados)
- [ ] Entendo que **TODAS as tabelas de negócio** têm `tenantId`
- [ ] Entendo que **middleware filtra automaticamente** por `tenantId`
- [ ] Entendo que **Super Admin é exceção** (vê todos os tenants)

---

Ficou claro agora? Quer que eu explique alguma parte específica mais detalhadamente?
