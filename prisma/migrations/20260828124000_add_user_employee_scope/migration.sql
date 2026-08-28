CREATE TABLE IF NOT EXISTS "UserEmployeeLink" (
  "userId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserEmployeeLink_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserEmployeeLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserEmployeeLink_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserEmployeeLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserEmployeeLink_employeeId_key" ON "UserEmployeeLink"("employeeId");
CREATE INDEX IF NOT EXISTS "UserEmployeeLink_companyId_idx" ON "UserEmployeeLink"("companyId");
