CREATE TABLE "HrAuditEvent" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HrAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HrAuditEvent_companyId_idx" ON "HrAuditEvent"("companyId");
CREATE INDEX "HrAuditEvent_actorUserId_idx" ON "HrAuditEvent"("actorUserId");
CREATE INDEX "HrAuditEvent_entityType_idx" ON "HrAuditEvent"("entityType");
CREATE INDEX "HrAuditEvent_entityId_idx" ON "HrAuditEvent"("entityId");
CREATE INDEX "HrAuditEvent_createdAt_idx" ON "HrAuditEvent"("createdAt");
