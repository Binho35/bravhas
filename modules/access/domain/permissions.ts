export const permissions = [
  "employee.read.self",
  "employee.read.team",
  "employee.read.all",
  "employee.create",
  "employee.update",
  "employee.document.read",
  "employee.document.manage",
  "attendance.read.self",
  "attendance.read.team",
  "attendance.read.all",
  "attendance.treat.team",
  "attendance.audit",
  "vacation.request",
  "vacation.approve.team",
  "vacation.manage",
  "benefit.read.self",
  "benefit.manage",
  "leave.read.self",
  "leave.manage",
  "disciplinary.create",
  "disciplinary.read",
  "payroll.read.self",
  "payroll.prepare",
  "payroll.audit",
  "hr.channel.use",
  "hr.channel.manage",
  "recruitment.manage",
  "performance.self",
  "performance.team",
  "performance.manage",
  "audit.read",
  "settings.manage",
] as const;

export type Permission = (typeof permissions)[number];

export type AccessRole =
  | "EMPLOYEE"
  | "MANAGER"
  | "HR"
  | "PAYROLL"
  | "ADMIN"
  | "OWNER";

export const rolePermissions: Record<AccessRole, readonly Permission[]> = {
  EMPLOYEE: [
    "employee.read.self",
    "attendance.read.self",
    "vacation.request",
    "benefit.read.self",
    "leave.read.self",
    "payroll.read.self",
    "hr.channel.use",
    "performance.self",
  ],
  MANAGER: [
    "employee.read.self",
    "employee.read.team",
    "attendance.read.self",
    "attendance.read.team",
    "attendance.treat.team",
    "vacation.request",
    "vacation.approve.team",
    "benefit.read.self",
    "leave.read.self",
    "payroll.read.self",
    "hr.channel.use",
    "performance.self",
    "performance.team",
  ],
  HR: [
    "employee.read.self",
    "employee.read.team",
    "employee.read.all",
    "employee.create",
    "employee.update",
    "employee.document.read",
    "employee.document.manage",
    "attendance.read.all",
    "attendance.audit",
    "vacation.manage",
    "benefit.manage",
    "leave.manage",
    "disciplinary.create",
    "disciplinary.read",
    "hr.channel.manage",
    "recruitment.manage",
    "performance.manage",
    "audit.read",
  ],
  PAYROLL: [
    "employee.read.all",
    "employee.document.read",
    "attendance.read.all",
    "attendance.audit",
    "vacation.manage",
    "benefit.manage",
    "leave.manage",
    "disciplinary.read",
    "payroll.prepare",
    "payroll.audit",
    "audit.read",
  ],
  ADMIN: permissions,
  OWNER: permissions,
};

export function roleHasPermission(role: AccessRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
