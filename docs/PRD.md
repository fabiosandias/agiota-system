# Agiota System Product Requirements Document

## 1. Overview
### 1.1 Vision
Deliver a single-user loan management system that centralizes client records, loan contracts, and financial tracking with a modern, responsive experience.

### 1.2 Product Snapshot
- **Product name:** Agiota System
- **Audience:** One administrator user (owner of the loan business)
- **Platform:** Web app (React frontend + Node.js backend)
- **Business value:** Replace manual spreadsheets with automated loan tracking, interest calculations, and at-a-glance profitability insights.

## 2. Goals and Success Criteria
### 2.1 Primary Objectives
- Enable the administrator to authenticate securely and access a private dashboard.
- Simplify client onboarding, loan creation, and lifecycle management.
- Automate compound interest calculations applied only on the due date.
- Provide real-time financial summaries covering profit, loss, and overdue exposure.
- Support exporting key financial data for offline review.

### 2.2 Success Metrics
- Time to register a new loan remains under 2 minutes end-to-end.
- Dashboard cards reflect up-to-date metrics within 5 seconds of data changes.
- 100% of overdue loans flagged within 24 hours of passing the due date.
- Zero critical security issues (authentication bypass, data leaks) in production.

### 2.3 Out of Scope
- Multi-user access or role-based permissions beyond the single admin.
- Automated payment processing or integration with payment gateways.
- Native mobile applications.

## 3. Users and Personas
### 3.1 Primary Persona
**Loan Administrator (Owner):** Tech-savvy enough to use modern web tools. Needs quick insight into outstanding loans, upcoming receivables, and problematic clients. Values automation, accuracy, and traceability.

### 3.2 User Needs
- Secure login and quick access to the full system.
- Fast client lookup with clear loan history.
- Simple workflows to create, close, and renegotiate loans.
- Visibility into cash flow (expected vs. received) and overdue items.

## 4. Product Scope
### 4.1 In Scope
- Authentication via email/password with JWT session handling.
- Client registry with CRUD, search, and detailed drill-down.
- Loan lifecycle management (create, view, update status, close, renegotiate, delete).
- Automatic compound interest calculation at each due date.
- Dashboard metrics and charts for upcoming, closed, profit, and loss views.
- Financial reports (loan extract, cash flow) with CSV and PDF exports.
- Company cash account management with running balance, ledger de entradas/saídas e vínculo com cada empréstimo/pagamento.
- Activity logging for critical operations (loan creation, updates, deletes, auth events).

### 4.2 Optional / Stretch Goals
- Debt renegotiation workflow persisting renegotiation terms.
- Configurable notifications (email/SMS) to alert about upcoming or overdue loans.

### 4.3 Out of Scope (Reiteration)
- Support for multiple admins or clients logging in.
- Advanced analytics beyond the described dashboards and exports.
- Integration with external CRMs or accounting systems.

## 5. User Experience
### 5.1 Key User Journeys
- **Login:** Enter email and password, receive JWT-backed session, redirected to dashboard.
- **Add Client:** Access clients page, use "New Client" form or quick add modal during loan creation.
- **Create Loan:** Select existing client or create new, input principal, interest rate, due date, review confirmation modal, save.
- **Manage Loan:** From loan list or client detail, update status (paid, renegotiated, deleted), record payment, or mark loss.
- **Monitor Dashboard:** Review KPI cards, monthly profit/loss chart, and quick actions.
- **Generate Report:** Navigate to reports, filter by date/status, export CSV or PDF.

### 5.2 Primary Screens
1. Login page
2. Dashboard with KPI cards, chart, quick actions
3. Clients list with search and pagination
4. Client detail with contact info, loan history, status summary
5. Loans list with filters (active, overdue, closed) and quick actions
6. Loan creation wizard/modal with confirmation step
7. Reports page (filters + export buttons)

### 5.3 UX Guidelines
- Responsive design targeting desktop first, with tablet/mobile support.
- Use Tailwind + ShadCN UI for consistent component styling.
- Provide inline validation and feedback for required fields using React Hook Form + Yup schemas.
- Apply input masking for monetary values, CPF, and phone numbers to reduce data entry errors.
- Show status chips for loan states (active, overdue, paid, renegotiated).

## 6. Functional Requirements
### 6.1 Authentication (AUTH)
- **AUTH-1:** User can log in with email and password via `/auth/login` endpoint.
- **AUTH-2:** Passwords stored hashed with bcrypt.
- **AUTH-3:** JWT is issued on successful login and stored in httpOnly cookie.
- **AUTH-4:** Provide password reset flow (email lookup, reset token, new password form).

### 6.2 Dashboard (DASH)
- **DASH-1:** Display counts for upcoming loans (not yet due), closed loans, total compound interest received, total losses from overdue/unpaid loans.
- **DASH-2:** Plot monthly profit/loss in a line or bar chart sourced from payments and outstanding amounts.
- **DASH-3:** Offer quick action buttons for adding a client or loan.

### 6.3 Clients (CLI)
- **CLI-1:** List clients with pagination (default 10 per page) and search by name, CPF, or phone.
- **CLI-2:** Create, update, delete client records.
- **CLI-3:** Client detail view shows profile info, loan history (open, closed, overdue), and overall status.
- **CLI-4:** From client detail, initiate new loan creation pre-filled with client data.

### 6.4 Loans (LOAN)
- **LOAN-1:** List loans with filters (active, overdue, closed) and quick actions (mark paid, renegotiate, delete).
- **LOAN-2:** Create loan by selecting an existing client or creating a new one inline.
- **LOAN-3:** Required inputs: principal amount (BRL), interest rate (% per period), due date, optional notes.
- **LOAN-4:** Display confirmation modal summarizing loan details before saving.
- **LOAN-5:** Automatic compound interest applied at each due date based on outstanding principal.
- **LOAN-6:** Support renegotiation by creating a new schedule or updating terms while logging history.

### 6.5 Payments & Tracking (PAY)
- **PAY-1:** Record payments associated with a loan, capturing amount, date, method, tipo (parcial, integral, parcela) e componentes de principal/juros.
- **PAY-2:** Update loan status to paid when payments cover principal + interest, considerando quitações parciais e vínculo com parcelas previstas.
- **PAY-3:** Flag loans/parcelas as overdue when current date > due date and outstanding balance > 0.
- **PAY-4:** Allow marking a loan as loss (write-off) with recorded reason.

### 6.6 Reports (REP)
- **REP-1:** Generate loan extract for active loans with filters (client, status, date range).
- **REP-2:** Provide cash flow report showing received vs. expected amounts by month.
- **REP-3:** Export report data as CSV and PDF.

### 6.7 Audit Logging (LOG)
- **LOG-1:** Track critical actions (login, loan creation, status changes, deletions) with timestamp and metadata.
- **LOG-2:** Expose logs to admin via backend query or export (UI view optional).

## 7. Business Rules and Calculations
- **BR-1:** Compound interest is applied only on each due date. New balance = prior balance * (1 + rate).
- **BR-6:** Cada liberação de empréstimo debita a conta da empresa e gera lançamento em ledger; pagamentos (parciais ou totais) creditam a conta de acordo com os componentes de principal/juros.
- **BR-7:** Parcelas podem ser geradas mensalmente, suportando pagamentos parciais; o sistema recalcula juros compostos sobre o saldo devedor restante.
- **BR-2:** Administrator can configure interest rate per loan; defaults may be provided by the system configuration.
- **BR-3:** Loan statuses: `active`, `due soon`, `overdue`, `paid`, `renegotiated`, `written_off`.
- **BR-4:** Overdue loans contribute to losses until payment received or written off.
- **BR-5:** Renegotiation preserves original loan record while creating a new schedule or status entry for traceability.

## 8. Data Model
### 8.1 Entities
- **users**: id, email, password_hash, name, created_at, updated_at.
- **clients**: id, name, cpf, phone, email, address, created_at, updated_at.
- **loans**: id, client_id, account_id, principal_amount, interest_rate, due_date, status, notes, created_at, updated_at.
- **accounts**: id, name, initial_balance, current_balance, created_at, updated_at.
- **loan_installments**: id, loan_id, sequence, due_date, principal_due, interest_due, total_due, paid_amount, status, created_at, updated_at.
- **installment_payments**: id, installment_id, payment_id, amount, created_at.
- **account_transactions**: id, account_id, loan_id?, payment_id?, direction (debit/credit), amount, occurred_at, description, created_at.
- **payments**: id, loan_id, account_id, amount, payment_date, method, type, principal_component, interest_component, installment_number, created_at.
- **logs**: id, actor_id, action, entity_type, entity_id, payload, created_at.

### 8.2 Relationships
- `users` (1) — (N) `logs`
- `accounts` (1) — (N) `loans`
- `accounts` (1) — (N) `payments`
- `accounts` (1) — (N) `account_transactions`
- `clients` (1) — (N) `loans`
- `loans` (1) — (N) `payments`
- `loans` (1) — (N) `loan_installments`
- `loan_installments` (1) — (N) `installment_payments`
- `payments` (1) — (N) `installment_payments`

## 9. API Surface
- `POST /auth/login`
- `POST /auth/reset-request`
- `POST /auth/reset`
- `GET /dashboard/summary`
- `GET /clients`
- `POST /clients`
- `GET /clients/:id`
- `PUT /clients/:id`
- `DELETE /clients/:id`
- `GET /loans`
- `POST /loans`
- `GET /loans/:id`
- `PUT /loans/:id`
- `DELETE /loans/:id`
- `POST /loans/:id/payments`
- `PUT /loans/:id/payments/:paymentId`
- `DELETE /loans/:id/payments/:paymentId`
- `POST /loans/:id/renegotiate`
- `GET /reports/loans`
- `GET /reports/cashflow`
- `GET /logs`

## 10. Technical Architecture
### 10.1 Frontend
- React 19 + Vite
- TailwindCSS + ShadCN UI component library
- TanStack Query for data fetching and caching
- React Router for navigation
- React Hook Form + Yup for form state, validation, and schema enforcement
- JWT handled via httpOnly cookies; use protected routes on the client

### 10.2 Backend
- Node.js 20+, Express.js for REST API
- Prisma ORM for database access
- Zod for request validation
- JWT for authentication and authorization
- Bcrypt for password hashing

### 10.3 Infrastructure
- PostgreSQL database
- Docker Compose orchestrating services: `frontend`, `backend`, `db`
- Separate `.env` files for development and production
- Deployment target candidates: Railway, Render, or self-managed VPS with Docker

## 11. Security and Compliance
- Enforce HTTPS in production deployments.
- Store JWT in httpOnly, secure cookies to mitigate XSS.
- Rate-limit login endpoint to prevent brute-force attacks.
- Validate and sanitize all inputs through Zod schemas.
- Implement audit logging for critical changes.
- Apply least-privilege principle on database credentials.

## 12. Reporting and Analytics
- Dashboard metrics derive from loan statuses, payment history, and overdue tracking.
- Profit = sum of interest received on paid loans.
- Loss = sum of outstanding balances marked as written off or overdue beyond configured threshold.
- Cash flow report compares expected repayments (scheduled) against actual payments per month.

## 13. Operational Considerations
- Seed initial admin user via migration or bootstrap script.
- Provide Docker-based local development with hot reloading.
- Continuous integration should run linting, tests, and type checks for both frontend and backend.
- Set up backup strategy for PostgreSQL (daily snapshot minimum).

## 14. Risks and Mitigations
- **Data inconsistency:** Use Prisma migrations and transactions to maintain integrity.
- **Complex interest calculations:** Centralize calculation logic with unit tests covering edge cases.
- **Single point of failure:** Ensure automated backups and disaster recovery runbooks.
- **Security gaps:** Conduct periodic dependency audits and patch management.

## 15. Assumptions and Open Questions
- Only one administrator account is needed; no user management UI required.
- Compound interest period matches loan due date frequency (monthly unless defined otherwise).
- Email service for password reset will be configured (provider TBD).
- Are renegotiated terms versioned or does it replace the existing loan? (Decision pending.)
- Do exports require branding or custom templates? (Decision pending.)

