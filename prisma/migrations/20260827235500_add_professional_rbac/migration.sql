CREATE TABLE "AccessProfile" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "master" BOOLEAN NOT NULL DEFAULT false,
  "system" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AccessProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AccessProfile_companyId_name_key" ON "AccessProfile"("companyId", "name");
CREATE INDEX "AccessProfile_companyId_idx" ON "AccessProfile"("companyId");

CREATE TABLE "AccessPermission" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "canView" BOOLEAN NOT NULL DEFAULT false,
  "canCreate" BOOLEAN NOT NULL DEFAULT false,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "canApprove" BOOLEAN NOT NULL DEFAULT false,
  "canDelete" BOOLEAN NOT NULL DEFAULT false,
  "canExport" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessPermission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AccessPermission_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AccessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AccessPermission_profileId_resource_key" ON "AccessPermission"("profileId", "resource");
CREATE INDEX "AccessPermission_profileId_idx" ON "AccessPermission"("profileId");

CREATE TABLE "UserAccessProfile" (
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAccessProfile_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserAccessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserAccessProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AccessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "UserAccessProfile_profileId_idx" ON "UserAccessProfile"("profileId");
