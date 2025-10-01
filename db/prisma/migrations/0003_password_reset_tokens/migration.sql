CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens" ("user_id");
