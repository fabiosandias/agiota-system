-- Create new enums for installments, payments, and account transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installmentstatus') THEN
        CREATE TYPE "InstallmentStatus" AS ENUM ('pending', 'partial', 'paid', 'overdue');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymenttype') THEN
        CREATE TYPE "PaymentType" AS ENUM ('lump_sum', 'partial', 'installment');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transactiondirection') THEN
        CREATE TYPE "TransactionDirection" AS ENUM ('debit', 'credit');
    END IF;
END$$;

-- Accounts table to hold company cash balance
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "initial_balance" NUMERIC(14, 2) NOT NULL DEFAULT 0,
    "current_balance" NUMERIC(14, 2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default account if none exists
INSERT INTO "accounts" ("id", "name", "initial_balance", "current_balance")
VALUES ('11111111-1111-1111-1111-111111111111', 'Conta Principal', 0, 0)
ON CONFLICT ("id") DO NOTHING;

-- Add relation between loans and accounts
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "account_id" UUID;
UPDATE "loans" SET "account_id" = '11111111-1111-1111-1111-111111111111' WHERE "account_id" IS NULL;
ALTER TABLE "loans" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "loans" ADD CONSTRAINT "loans_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS "loans_account_id_idx" ON "loans" ("account_id");

-- Loan installments schedule
CREATE TABLE IF NOT EXISTS "loan_installments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loan_id" UUID NOT NULL REFERENCES "loans"("id") ON DELETE CASCADE,
    "sequence" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "principal_due" NUMERIC(14, 2) NOT NULL,
    "interest_due" NUMERIC(14, 2) NOT NULL,
    "total_due" NUMERIC(14, 2) NOT NULL,
    "paid_amount" NUMERIC(14, 2) NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "loan_installments_sequence_unique" UNIQUE ("loan_id", "sequence")
);
CREATE INDEX IF NOT EXISTS "loan_installments_loan_id_idx" ON "loan_installments" ("loan_id");

-- Junction between installments and payments (supports partial payments)
CREATE TABLE IF NOT EXISTS "installment_payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "installment_id" UUID NOT NULL REFERENCES "loan_installments"("id") ON DELETE CASCADE,
    "payment_id" UUID NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
    "amount" NUMERIC(14, 2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "installment_payment_unique" UNIQUE ("installment_id", "payment_id")
);
CREATE INDEX IF NOT EXISTS "installment_payments_payment_id_idx" ON "installment_payments" ("payment_id");

-- Extend payments with richer tracking
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "account_id" UUID;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "type" "PaymentType" NOT NULL DEFAULT 'partial';
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "principal_component" NUMERIC(14, 2);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "interest_component" NUMERIC(14, 2);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "installment_number" INTEGER;
UPDATE "payments" SET "account_id" = '11111111-1111-1111-1111-111111111111' WHERE "account_id" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "payments" ADD CONSTRAINT "payments_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS "payments_account_id_idx" ON "payments" ("account_id");

-- Ledger table for cash movements
CREATE TABLE IF NOT EXISTS "account_transactions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "account_id" UUID NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
    "loan_id" UUID REFERENCES "loans"("id") ON DELETE SET NULL,
    "payment_id" UUID REFERENCES "payments"("id") ON DELETE SET NULL,
    "direction" "TransactionDirection" NOT NULL,
    "amount" NUMERIC(14, 2) NOT NULL,
    "description" TEXT,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "account_transactions_account_id_idx" ON "account_transactions" ("account_id");
CREATE INDEX IF NOT EXISTS "account_transactions_loan_id_idx" ON "account_transactions" ("loan_id");
CREATE INDEX IF NOT EXISTS "account_transactions_payment_id_idx" ON "account_transactions" ("payment_id");
