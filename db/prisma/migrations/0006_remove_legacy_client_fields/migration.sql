-- AlterTable: Remove campos legados cpf e address do modelo Client
ALTER TABLE "clients" DROP COLUMN IF EXISTS "cpf";
ALTER TABLE "clients" DROP COLUMN IF EXISTS "address";
