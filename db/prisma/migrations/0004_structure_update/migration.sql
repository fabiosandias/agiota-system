-- Ensure custom enums exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentType') THEN
    CREATE TYPE "DocumentType" AS ENUM ('cpf', 'cnpj');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountType') THEN
    CREATE TYPE "AccountType" AS ENUM ('checking', 'savings');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('admin', 'operator', 'viewer');
  END IF;
END$$;

-- Users table adjustments
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "first_name" TEXT,
  ADD COLUMN IF NOT EXISTS "last_name" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'operator';

-- Addresses table shared by clients and users
CREATE TABLE IF NOT EXISTS "addresses" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "label" TEXT NOT NULL DEFAULT 'primary',
  "postal_code" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "complement" TEXT,
  "client_id" UUID,
  "user_id" UUID UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "addresses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE,
  CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "addresses_owner_check" CHECK (("client_id" IS NOT NULL AND "user_id" IS NULL) OR ("client_id" IS NULL AND "user_id" IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS "addresses_city_idx" ON "addresses" ("city");
CREATE INDEX IF NOT EXISTS "addresses_postal_code_idx" ON "addresses" ("postal_code");

-- Clients table adjustments
ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "first_name" TEXT,
  ADD COLUMN IF NOT EXISTS "last_name" TEXT,
  ADD COLUMN IF NOT EXISTS "document" TEXT,
  ADD COLUMN IF NOT EXISTS "document_type" "DocumentType",
  ADD COLUMN IF NOT EXISTS "birth_date" DATE;

CREATE INDEX IF NOT EXISTS "clients_document_idx" ON "clients" ("document");

-- Accounts table adjustments
ALTER TABLE "accounts"
  ADD COLUMN IF NOT EXISTS "user_id" UUID,
  ADD COLUMN IF NOT EXISTS "bank_name" TEXT,
  ADD COLUMN IF NOT EXISTS "branch" TEXT,
  ADD COLUMN IF NOT EXISTS "account_number" TEXT,
  ADD COLUMN IF NOT EXISTS "type" "AccountType" NOT NULL DEFAULT 'checking',
  ADD COLUMN IF NOT EXISTS "opening_balance" NUMERIC(14, 2) NOT NULL DEFAULT 0;

UPDATE "accounts"
SET "opening_balance" = COALESCE("opening_balance", "initial_balance", 0);

CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'accounts_user_id_fkey'
  ) THEN
    ALTER TABLE "accounts"
      ADD CONSTRAINT "accounts_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE SET NULL;
  END IF;
END$$;
