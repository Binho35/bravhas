-- Financial baseline migration.
-- This migration closes a historical gap where Prisma models existed without
-- an equivalent migration. It is intentionally additive/defensive so existing
-- installations that already contain these objects are not destructively reset.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FinancialAccountType') THEN
    CREATE TYPE "FinancialAccountType" AS ENUM ('PAYABLE', 'RECEIVABLE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FinancialAccountStatus') THEN
    CREATE TYPE "FinancialAccountStatus" AS ENUM ('OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FinancialTransactionType') THEN
    CREATE TYPE "FinancialTransactionType" AS ENUM ('PAYMENT', 'RECEIPT', 'REVERSAL', 'CANCELLATION');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "branchId" TEXT,
  "name" TEXT NOT NULL,
  "document" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "branchId" TEXT,
  "name" TEXT NOT NULL,
  "document" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FinancialCategory" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "branchId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CostCenter" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "branchId" TEXT,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankAccount" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "branchId" TEXT,
  "name" TEXT NOT NULL,
  "bankCode" TEXT,
  "bankName" TEXT,
  "agency" TEXT,
  "accountNumber" TEXT,
  "accountType" TEXT,
  "pixKey" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FinancialAccount" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "costCenterId" TEXT,
  "categoryId" TEXT,
  "supplierId" TEXT,
  "customerId" TEXT,
  "bankAccountId" TEXT,
  "type" "FinancialAccountType" NOT NULL,
  "status" "FinancialAccountStatus" NOT NULL,
  "description" TEXT NOT NULL,
  "documentNumber" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "paymentDate" TIMESTAMP(3),
  "amount" DECIMAL(15,2) NOT NULL,
  "paidAmount" DECIMAL(15,2) NOT NULL,
  "discount" DECIMAL(15,2) NOT NULL,
  "interest" DECIMAL(15,2) NOT NULL,
  "fine" DECIMAL(15,2) NOT NULL,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FinancialTransaction" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "type" "FinancialTransactionType" NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys only when an equivalent FK for the same local column does not exist.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Supplier','companyId','Supplier_companyId_fkey','Company','id','RESTRICT'),
      ('Supplier','branchId','Supplier_branchId_fkey','Branch','id','SET NULL'),
      ('Customer','companyId','Customer_companyId_fkey','Company','id','RESTRICT'),
      ('Customer','branchId','Customer_branchId_fkey','Branch','id','SET NULL'),
      ('FinancialCategory','companyId','FinancialCategory_companyId_fkey','Company','id','RESTRICT'),
      ('FinancialCategory','branchId','FinancialCategory_branchId_fkey','Branch','id','SET NULL'),
      ('CostCenter','companyId','CostCenter_companyId_fkey','Company','id','RESTRICT'),
      ('CostCenter','branchId','CostCenter_branchId_fkey','Branch','id','SET NULL'),
      ('BankAccount','companyId','BankAccount_companyId_fkey','Company','id','RESTRICT'),
      ('BankAccount','branchId','BankAccount_branchId_fkey','Branch','id','SET NULL'),
      ('FinancialAccount','companyId','FinancialAccount_companyId_fkey','Company','id','RESTRICT'),
      ('FinancialAccount','branchId','FinancialAccount_branchId_fkey','Branch','id','RESTRICT'),
      ('FinancialAccount','costCenterId','FinancialAccount_costCenterId_fkey','CostCenter','id','SET NULL'),
      ('FinancialAccount','categoryId','FinancialAccount_categoryId_fkey','FinancialCategory','id','SET NULL'),
      ('FinancialAccount','supplierId','FinancialAccount_supplierId_fkey','Supplier','id','SET NULL'),
      ('FinancialAccount','customerId','FinancialAccount_customerId_fkey','Customer','id','SET NULL'),
      ('FinancialAccount','bankAccountId','FinancialAccount_bankAccountId_fkey','BankAccount','id','SET NULL'),
      ('FinancialAccount','createdBy','FinancialAccount_createdBy_fkey','User','id','RESTRICT'),
      ('FinancialAccount','updatedBy','FinancialAccount_updatedBy_fkey','User','id','SET NULL'),
      ('FinancialTransaction','accountId','FinancialTransaction_accountId_fkey','FinancialAccount','id','CASCADE'),
      ('FinancialTransaction','performedBy','FinancialTransaction_performedBy_fkey','User','id','RESTRICT')
    ) AS v(table_name, column_name, constraint_name, ref_table, ref_column, delete_action)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'f'
        AND t.relname = r.table_name
        AND a.attname = r.column_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE %s ON UPDATE CASCADE',
        r.table_name, r.constraint_name, r.column_name, r.ref_table, r.ref_column, r.delete_action
      );
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS "Supplier_companyId_idx" ON "Supplier"("companyId");
CREATE INDEX IF NOT EXISTS "Supplier_branchId_idx" ON "Supplier"("branchId");
CREATE INDEX IF NOT EXISTS "Supplier_document_idx" ON "Supplier"("document");
CREATE INDEX IF NOT EXISTS "Supplier_active_idx" ON "Supplier"("active");

CREATE INDEX IF NOT EXISTS "Customer_companyId_idx" ON "Customer"("companyId");
CREATE INDEX IF NOT EXISTS "Customer_branchId_idx" ON "Customer"("branchId");
CREATE INDEX IF NOT EXISTS "Customer_document_idx" ON "Customer"("document");
CREATE INDEX IF NOT EXISTS "Customer_active_idx" ON "Customer"("active");

CREATE INDEX IF NOT EXISTS "FinancialCategory_companyId_idx" ON "FinancialCategory"("companyId");
CREATE INDEX IF NOT EXISTS "FinancialCategory_branchId_idx" ON "FinancialCategory"("branchId");
CREATE INDEX IF NOT EXISTS "FinancialCategory_active_idx" ON "FinancialCategory"("active");

CREATE INDEX IF NOT EXISTS "CostCenter_companyId_idx" ON "CostCenter"("companyId");
CREATE INDEX IF NOT EXISTS "CostCenter_branchId_idx" ON "CostCenter"("branchId");
CREATE INDEX IF NOT EXISTS "CostCenter_active_idx" ON "CostCenter"("active");

CREATE INDEX IF NOT EXISTS "BankAccount_companyId_idx" ON "BankAccount"("companyId");
CREATE INDEX IF NOT EXISTS "BankAccount_branchId_idx" ON "BankAccount"("branchId");
CREATE INDEX IF NOT EXISTS "BankAccount_active_idx" ON "BankAccount"("active");

CREATE INDEX IF NOT EXISTS "FinancialAccount_companyId_idx" ON "FinancialAccount"("companyId");
CREATE INDEX IF NOT EXISTS "FinancialAccount_branchId_idx" ON "FinancialAccount"("branchId");
CREATE INDEX IF NOT EXISTS "FinancialAccount_costCenterId_idx" ON "FinancialAccount"("costCenterId");
CREATE INDEX IF NOT EXISTS "FinancialAccount_categoryId_idx" ON "FinancialAccount"("categoryId");
CREATE INDEX IF NOT EXISTS "FinancialAccount_supplierId_idx" ON "FinancialAccount"("supplierId");
CREATE INDEX IF NOT EXISTS "FinancialAccount_customerId_idx" ON "FinancialAccount"("customerId");
CREATE INDEX IF NOT EXISTS "FinancialAccount_bankAccountId_idx" ON "FinancialAccount"("bankAccountId");
CREATE INDEX IF NOT EXISTS "FinancialAccount_type_idx" ON "FinancialAccount"("type");
CREATE INDEX IF NOT EXISTS "FinancialAccount_status_idx" ON "FinancialAccount"("status");
CREATE INDEX IF NOT EXISTS "FinancialAccount_dueDate_idx" ON "FinancialAccount"("dueDate");
CREATE INDEX IF NOT EXISTS "FinancialAccount_paymentDate_idx" ON "FinancialAccount"("paymentDate");
CREATE INDEX IF NOT EXISTS "FinancialAccount_createdBy_idx" ON "FinancialAccount"("createdBy");
CREATE INDEX IF NOT EXISTS "FinancialAccount_updatedBy_idx" ON "FinancialAccount"("updatedBy");

CREATE INDEX IF NOT EXISTS "FinancialTransaction_accountId_idx" ON "FinancialTransaction"("accountId");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_performedBy_idx" ON "FinancialTransaction"("performedBy");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_type_idx" ON "FinancialTransaction"("type");
CREATE INDEX IF NOT EXISTS "FinancialTransaction_performedAt_idx" ON "FinancialTransaction"("performedAt");
