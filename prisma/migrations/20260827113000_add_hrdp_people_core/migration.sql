-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('PRE_ADMISSION', 'ACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('CLT', 'EXPERIENCE', 'INTERN', 'APPRENTICE', 'CONTRACTOR', 'TEMPORARY', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "HrRequestStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HrTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_EMPLOYEE', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisciplinaryActionType" AS ENUM ('VERBAL_GUIDANCE', 'WRITTEN_WARNING', 'SUSPENSION', 'TERMINATION_FOR_CAUSE');

-- CreateTable
CREATE TABLE "HrDepartment" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "branchId" TEXT,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPosition" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "departmentId" TEXT,
  "name" TEXT NOT NULL,
  "cbo" TEXT,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrEmployee" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "branchId" TEXT,
  "departmentId" TEXT,
  "positionId" TEXT,
  "managerId" TEXT,
  "employeeNumber" TEXT,
  "fullName" TEXT NOT NULL,
  "socialName" TEXT,
  "cpf" TEXT,
  "rg" TEXT,
  "birthDate" TIMESTAMP(3),
  "emailPersonal" TEXT,
  "emailCorporate" TEXT,
  "phone" TEXT,
  "hireDate" TIMESTAMP(3),
  "terminationDate" TIMESTAMP(3),
  "employmentType" "EmploymentType",
  "workMode" "WorkMode",
  "weeklyHours" DECIMAL(6,2),
  "baseSalary" DECIMAL(15,2),
  "status" "EmployeeStatus" NOT NULL DEFAULT 'PRE_ADMISSION',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrEmployeeDocument" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "storageKey" TEXT,
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "verifiedBy" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrEmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrTimeOccurrence" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "referenceDate" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "HrRequestStatus" NOT NULL DEFAULT 'PENDING',
  "employeeNote" TEXT,
  "managerNote" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrTimeOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrVacationRequest" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "sellDays" INTEGER NOT NULL DEFAULT 0,
  "advance13th" BOOLEAN NOT NULL DEFAULT false,
  "status" "HrRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrVacationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrLeaveRequest" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "cid" TEXT,
  "benefitNumber" TEXT,
  "status" "HrRequestStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrBenefitEnrollment" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "benefitType" TEXT NOT NULL,
  "provider" TEXT,
  "monthlyValue" DECIMAL(15,2),
  "employeeDiscount" DECIMAL(15,2),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrBenefitEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrDisciplinaryAction" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "type" "DisciplinaryActionType" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "issuedBy" TEXT,
  "acknowledgedAt" TIMESTAMP(3),
  "documentKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrDisciplinaryAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrTicket" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "employeeId" TEXT,
  "protocol" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "HrTicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "assignedTo" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HrTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HrDepartment_companyId_name_key" ON "HrDepartment"("companyId", "name");
CREATE INDEX "HrDepartment_companyId_idx" ON "HrDepartment"("companyId");
CREATE INDEX "HrDepartment_branchId_idx" ON "HrDepartment"("branchId");
CREATE INDEX "HrDepartment_active_idx" ON "HrDepartment"("active");
CREATE UNIQUE INDEX "HrPosition_companyId_name_key" ON "HrPosition"("companyId", "name");
CREATE INDEX "HrPosition_companyId_idx" ON "HrPosition"("companyId");
CREATE INDEX "HrPosition_departmentId_idx" ON "HrPosition"("departmentId");
CREATE INDEX "HrPosition_active_idx" ON "HrPosition"("active");
CREATE UNIQUE INDEX "HrEmployee_companyId_employeeNumber_key" ON "HrEmployee"("companyId", "employeeNumber");
CREATE UNIQUE INDEX "HrEmployee_companyId_cpf_key" ON "HrEmployee"("companyId", "cpf");
CREATE INDEX "HrEmployee_companyId_idx" ON "HrEmployee"("companyId");
CREATE INDEX "HrEmployee_branchId_idx" ON "HrEmployee"("branchId");
CREATE INDEX "HrEmployee_departmentId_idx" ON "HrEmployee"("departmentId");
CREATE INDEX "HrEmployee_positionId_idx" ON "HrEmployee"("positionId");
CREATE INDEX "HrEmployee_managerId_idx" ON "HrEmployee"("managerId");
CREATE INDEX "HrEmployee_status_idx" ON "HrEmployee"("status");
CREATE INDEX "HrEmployee_active_idx" ON "HrEmployee"("active");
CREATE INDEX "HrEmployee_fullName_idx" ON "HrEmployee"("fullName");
CREATE INDEX "HrEmployeeDocument_companyId_idx" ON "HrEmployeeDocument"("companyId");
CREATE INDEX "HrEmployeeDocument_employeeId_idx" ON "HrEmployeeDocument"("employeeId");
CREATE INDEX "HrEmployeeDocument_type_idx" ON "HrEmployeeDocument"("type");
CREATE INDEX "HrEmployeeDocument_expiresAt_idx" ON "HrEmployeeDocument"("expiresAt");
CREATE INDEX "HrTimeOccurrence_companyId_idx" ON "HrTimeOccurrence"("companyId");
CREATE INDEX "HrTimeOccurrence_employeeId_idx" ON "HrTimeOccurrence"("employeeId");
CREATE INDEX "HrTimeOccurrence_referenceDate_idx" ON "HrTimeOccurrence"("referenceDate");
CREATE INDEX "HrTimeOccurrence_status_idx" ON "HrTimeOccurrence"("status");
CREATE INDEX "HrVacationRequest_companyId_idx" ON "HrVacationRequest"("companyId");
CREATE INDEX "HrVacationRequest_employeeId_idx" ON "HrVacationRequest"("employeeId");
CREATE INDEX "HrVacationRequest_startDate_idx" ON "HrVacationRequest"("startDate");
CREATE INDEX "HrVacationRequest_status_idx" ON "HrVacationRequest"("status");
CREATE INDEX "HrLeaveRequest_companyId_idx" ON "HrLeaveRequest"("companyId");
CREATE INDEX "HrLeaveRequest_employeeId_idx" ON "HrLeaveRequest"("employeeId");
CREATE INDEX "HrLeaveRequest_startDate_idx" ON "HrLeaveRequest"("startDate");
CREATE INDEX "HrLeaveRequest_status_idx" ON "HrLeaveRequest"("status");
CREATE INDEX "HrBenefitEnrollment_companyId_idx" ON "HrBenefitEnrollment"("companyId");
CREATE INDEX "HrBenefitEnrollment_employeeId_idx" ON "HrBenefitEnrollment"("employeeId");
CREATE INDEX "HrBenefitEnrollment_benefitType_idx" ON "HrBenefitEnrollment"("benefitType");
CREATE INDEX "HrBenefitEnrollment_active_idx" ON "HrBenefitEnrollment"("active");
CREATE INDEX "HrDisciplinaryAction_companyId_idx" ON "HrDisciplinaryAction"("companyId");
CREATE INDEX "HrDisciplinaryAction_employeeId_idx" ON "HrDisciplinaryAction"("employeeId");
CREATE INDEX "HrDisciplinaryAction_type_idx" ON "HrDisciplinaryAction"("type");
CREATE INDEX "HrDisciplinaryAction_occurredAt_idx" ON "HrDisciplinaryAction"("occurredAt");
CREATE UNIQUE INDEX "HrTicket_protocol_key" ON "HrTicket"("protocol");
CREATE INDEX "HrTicket_companyId_idx" ON "HrTicket"("companyId");
CREATE INDEX "HrTicket_employeeId_idx" ON "HrTicket"("employeeId");
CREATE INDEX "HrTicket_status_idx" ON "HrTicket"("status");
CREATE INDEX "HrTicket_category_idx" ON "HrTicket"("category");
CREATE INDEX "HrTicket_createdAt_idx" ON "HrTicket"("createdAt");

-- AddForeignKey
ALTER TABLE "HrPosition" ADD CONSTRAINT "HrPosition_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "HrDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "HrPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "HrEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HrEmployeeDocument" ADD CONSTRAINT "HrEmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrTimeOccurrence" ADD CONSTRAINT "HrTimeOccurrence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrVacationRequest" ADD CONSTRAINT "HrVacationRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrLeaveRequest" ADD CONSTRAINT "HrLeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrBenefitEnrollment" ADD CONSTRAINT "HrBenefitEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrDisciplinaryAction" ADD CONSTRAINT "HrDisciplinaryAction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HrTicket" ADD CONSTRAINT "HrTicket_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "HrEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
