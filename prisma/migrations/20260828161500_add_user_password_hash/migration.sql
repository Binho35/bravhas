ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

CREATE INDEX IF NOT EXISTS "User_passwordHash_idx"
ON "User"("passwordHash")
WHERE "passwordHash" IS NOT NULL;
