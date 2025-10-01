CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "clients" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "cpf" VARCHAR(14) NOT NULL UNIQUE,
    "phone" VARCHAR(20),
    "email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loanstatus') THEN
        CREATE TYPE "LoanStatus" AS ENUM ('active', 'due_soon', 'overdue', 'paid', 'renegotiated', 'written_off');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS "loans" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "client_id" UUID NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
    "principal_amount" NUMERIC(12, 2) NOT NULL,
    "interest_rate" NUMERIC(5, 2) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "loans_client_id_idx" ON "loans" ("client_id");

CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "loan_id" UUID NOT NULL REFERENCES "loans"("id") ON DELETE CASCADE,
    "amount" NUMERIC(12, 2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "method" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "payments_loan_id_idx" ON "payments" ("loan_id");

CREATE TABLE IF NOT EXISTS "logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "payload" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "logs_actor_id_idx" ON "logs" ("actor_id");

