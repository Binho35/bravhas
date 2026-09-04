from pathlib import Path

path = Path("prisma/schema.prisma")
text = path.read_text()

if all(marker in text for marker in (
    "model UserEmployeeLink {",
    "model AccessProfile {",
    "model AccessPermission {",
    "model UserAccessProfile {",
    "model Obligation {",
    "passwordHash  String?",
)):
    print("Prisma schema already aligned.")
    raise SystemExit(0)

replacements = [
    (
        "  branches Branch[]\n  users    User[]\n",
        "  branches          Branch[]\n  users             User[]\n  accessProfiles    AccessProfile[]\n  userEmployeeLinks UserEmployeeLink[]\n  obligations       Obligation[]\n",
    ),
    (
        "  name          String\n  email         String\n  role          UserRole\n",
        "  name          String\n  email         String\n  passwordHash  String?\n  role          UserRole\n",
    ),
    (
        "  sessions UserSession[]\n\n  createdFinancialAccounts",
        "  sessions      UserSession[]\n  employeeLink  UserEmployeeLink?\n  accessProfile UserAccessProfile?\n\n  responsibleObligations Obligation[] @relation(\"ObligationResponsible\")\n  createdObligations     Obligation[] @relation(\"ObligationCreatedBy\")\n  updatedObligations     Obligation[] @relation(\"ObligationUpdatedBy\")\n\n  createdFinancialAccounts",
    ),
    (
        "  tickets            HrTicket[]\n\n  @@unique([companyId, employeeNumber])",
        "  tickets            HrTicket[]\n  userLink           UserEmployeeLink?\n\n  @@unique([companyId, employeeNumber])",
    ),
]

for old, new in replacements:
    if old not in text:
        raise RuntimeError(f"Expected schema anchor not found: {old!r}")
    text = text.replace(old, new, 1)

models = r'''

model UserEmployeeLink {
  userId     String   @id
  employeeId String   @unique
  companyId  String
  createdAt  DateTime @default(now())

  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  employee HrEmployee @relation(fields: [employeeId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  company  Company    @relation(fields: [companyId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([companyId])
}

model AccessProfile {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  description String?
  master      Boolean  @default(false)
  system      Boolean  @default(false)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company     Company             @relation(fields: [companyId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  permissions AccessPermission[]
  users       UserAccessProfile[]

  @@unique([companyId, name])
  @@index([companyId])
}

model AccessPermission {
  id         String   @id @default(uuid())
  profileId  String
  resource   String
  canView    Boolean  @default(false)
  canCreate  Boolean  @default(false)
  canEdit    Boolean  @default(false)
  canApprove Boolean  @default(false)
  canDelete  Boolean  @default(false)
  canExport  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  profile AccessProfile @relation(fields: [profileId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@unique([profileId, resource])
  @@index([profileId])
}

model UserAccessProfile {
  userId    String   @id
  profileId String
  createdAt DateTime @default(now())

  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  profile AccessProfile @relation(fields: [profileId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([profileId])
}

model Obligation {
  id                String   @id @default(uuid())
  companyId         String
  title             String
  description       String?
  area              String
  priority          String
  status            String   @default("PENDING")
  responsibleUserId String?
  responsibleName   String
  dueDate           DateTime
  completedAt       DateTime?
  recurrence        String   @default("NONE")
  notes             String?
  createdBy         String
  updatedBy         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  company         Company @relation(fields: [companyId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  responsibleUser User?   @relation("ObligationResponsible", fields: [responsibleUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)
  createdByUser   User    @relation("ObligationCreatedBy", fields: [createdBy], references: [id], onDelete: Restrict, onUpdate: Cascade)
  updatedByUser   User?   @relation("ObligationUpdatedBy", fields: [updatedBy], references: [id], onDelete: SetNull, onUpdate: Cascade)

  @@index([companyId])
  @@index([dueDate])
  @@index([status])
  @@index([area])
  @@index([responsibleUserId])
}
'''

text = text.rstrip() + models + "\n"
path.write_text(text)
print("Prisma schema aligned with existing migrations.")
