-- Persisted company-level opening balance for the consolidated cash-flow view.
-- Additive and non-destructive: existing financial data is preserved.

CREATE TABLE IF NOT EXISTS "CashFlowOpeningBalance" (
  "companyId" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "asOfDate" DATE NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashFlowOpeningBalance_pkey" PRIMARY KEY ("companyId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CashFlowOpeningBalance_companyId_fkey'
  ) THEN
    ALTER TABLE "CashFlowOpeningBalance"
      ADD CONSTRAINT "CashFlowOpeningBalance_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CashFlowOpeningBalance_updatedBy_fkey'
  ) THEN
    ALTER TABLE "CashFlowOpeningBalance"
      ADD CONSTRAINT "CashFlowOpeningBalance_updatedBy_fkey"
      FOREIGN KEY ("updatedBy") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "CashFlowOpeningBalance_updatedBy_idx"
  ON "CashFlowOpeningBalance"("updatedBy");
CREATE INDEX IF NOT EXISTS "CashFlowOpeningBalance_asOfDate_idx"
  ON "CashFlowOpeningBalance"("asOfDate");
