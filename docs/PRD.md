# AITRON Financeira – Product Requirements (v3)

## 0. Status e Princípios
- ✅ Login, rotas base e layout já operacionais.
- ⚠️ Tudo que existe deve continuar funcionando (login, rotas legadas, layout base).
- Estratégia de entrega incremental: migrations seguras + backfill → APIs → front → segurança → lint/tests.
- Feature flags quando necessário e regressão mínima a cada merge.

## 1. Padronização de Código
- ESLint + Prettier com os conjuntos: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`, `plugin:import/recommended`, `plugin:prettier/recommended`.
- Scripts
  - `lint`: `eslint . --ext .js,.jsx,.ts,.tsx`
  - `lint:fix`: `eslint . --ext .js,.jsx,.ts,.tsx --fix`
  - `format`: `prettier --write .`
- Editor: format on save + ESLint fix on save.
- Aceite: `npm run lint` sem erros, build intacto.

## 2. Modelo Lógico (Entidades)
- Client 1:N Address
- User 1:1 Address (endereço principal)
- User 1:N Account (contas financeiras)
- Loan referencia Account (obrigatório)
- Tabela única `address`
  - Campos: `id`, `label`, `postal_code`, `street`, `number`, `district`, `city`, `state`, `complement`, `client_id` (nullable), `user_id` (nullable), `created_at`, `updated_at`
  - Constraint: `(client_id IS NOT NULL AND user_id IS NULL) OR (client_id IS NULL AND user_id IS NOT NULL)`
- Convenção de nomes em inglês.

## 3. Fluxo de Endereço (ViaCEP)
- Cadastro: exibir apenas CEP → consulta ViaCEP → preenche e habilita edição; falha = libera todos os campos manualmente.
- Edição: todos os campos habilitados (sem nova consulta automática).
- Persistir CEP sem máscara; máscara/use Hook no front.
- `number` obrigatório, `complement` opcional.

## 4. Página de Clientes
- Listagem: colunas `Name`, `Document`, `Phone`, `Email`, `City`, `State`, `Created At`, `Actions`.
- Busca global (nome/documento/email/telefone) + filtros `name`, `district`, `city`.
- Paginação: 10/20/50 itens.
- CRUD
  - Campos: `firstName`, `lastName`, `email`, `phone`, `birthDate`, `document` (CPF/CNPJ com tipo).
  - Endereços: coletar `primary` + `business` no cadastro inicial usando fluxo CEP; permitir adicionar outros depois.
  - Exclusão bloqueada se houver empréstimos.

## 5. Página de Usuários do Sistema
- Campos: `firstName`, `lastName`, `email`, `phone`, `role`, endereço único (ViaCEP no cadastro).
- Usuário deve manter exatamente um endereço ativo.

## 6. Contas Financeiras
- Usuário pode ter N contas: `name`, `bankName`, `branch`, `accountNumber`, `type (checking|savings)`, `openingBalance`, `currentBalance`.
- Loan creation exige selecionar conta.
- Não excluir conta com lançamentos pendentes (obrigar transferência/baixa prévia).

## 7. Header – Saldo Total
- Mostrar soma de `currentBalance` das contas do usuário logado.
- Ícone “olho” para ocultar/mostrar valor, persistindo preferência na sessão.

## 8. APIs (novas/ajustadas)
- `/v1/clients` com filtros `search`, `name`, `district`, `city`, `page`, `pageSize`.
- `/v1/clients/:id` GET/PUT/DELETE.
- `/v1/clients/:id/addresses` GET/POST.
- `/v1/addresses/:id` PUT/DELETE.
- `/v1/users` CRUD paginado (`search`, `page`, `pageSize`).
- `/v1/users/:id/address` GET/PUT.
- `/v1/accounts` CRUD.
- `/v1/accounts/total-balance` retorna saldo agregado do usuário.
- Back valida CEP/CPF/CNPJ/phone.
- Paginação consistente (`page`, `pageSize`).
- Considerar versionamento `/v1` para não quebrar rotas antigas.

## 9. Banco e Migrações
- Novas tabelas/colunas descritas acima.
- Índices: `clients_document_idx`, `addresses_city_idx`, `addresses_postal_code_idx`, `accounts_user_id_idx`.
- Backfill quando necessário; migrações idempotentes.
- Documentar rollback.

## 10. Segurança
### API (Node/Express)
- JWT com Access (curto) + Refresh (longo), tokens em cookies httpOnly (SameSite=Lax). Bearer só onde indispensável.
- RBAC (roles: admin, operator, viewer) com guard por rota.
- Input hardening (Zod), sanitização, limites de payload.
- Rate limiting por IP/rota (ex.: 100 req / 15 min).
- CORS restrito a domínios confiáveis (`APP_URL`).
- Helmet + headers de segurança.
- Auditoria: logar eventos sensíveis (login, CRUD críticos).
- Mensagens de erro genéricas em produção; sem stack trace.
- Segredos via `.env`/vault (nunca versionados).

### Front-end (React)
- Guardas de rota (redirect anônimos, rotas/menus condicionados a role).
- Cookies httpOnly preferidos; evitar armazenar tokens sensíveis em `localStorage` (usar apenas flags).
- CSP rígida; evitar `unsafe-inline`.
- Sem HTML bruto sem sanitização.
- CSRF mitigada (SameSite adequado ou token dedicado).
- Logout invalida sessão local + refresh.

## 11. Testes
- Unit: validators, serviço ViaCEP, guards de permissão.
- Integração: CRUD completo (clientes/endereços/usuários/contas) + loan selecionando conta.
- E2E mínimo: login → clientes (filtros) → cria cliente com endereços (ViaCEP) → edita → lista → contas → header saldo/olho.
- Smoke regressão garantindo login e navegação.

## 12. Riscos & Mitigações
- Quebra de contrato: versionar rotas (`/v1`) e feature flags.
- Indisponibilidade ViaCEP: fallback manual + retries com backoff.
- Corrida de migrações: aplicar em janela controlada, backup e plano de rollback.

## 13. Plano de Entrega
1. Migrações (endereços/contas) + backfill + smoke.
2. APIs novas com testes unitários/integrados.
3. Front-end (forms CEP, tabelas com busca/filtros/paginação, novos fluxos).
4. Segurança (JWT refresh, RBAC, rate limit, headers, guards front).
5. Padronização ESLint/Prettier + CI.
6. E2E & regressão final (login/navegação + cenários críticos).
