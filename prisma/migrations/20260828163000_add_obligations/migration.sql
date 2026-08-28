CREATE TABLE "Obligation" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "area" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "responsibleUserId" TEXT,
  "responsibleName" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "recurrence" TEXT NOT NULL DEFAULT 'NONE',
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Obligation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Obligation_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Obligation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Obligation_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Obligation_companyId_idx" ON "Obligation"("companyId");
CREATE INDEX "Obligation_dueDate_idx" ON "Obligation"("dueDate");
CREATE INDEX "Obligation_status_idx" ON "Obligation"("status");
CREATE INDEX "Obligation_area_idx" ON "Obligation"("area");
CREATE INDEX "Obligation_responsibleUserId_idx" ON "Obligation"("responsibleUserId");
