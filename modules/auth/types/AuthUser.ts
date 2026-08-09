export type AuthUserRole =
  | "OWNER"
  | "ADMIN"
  | "FINANCIAL"
  | "HR"
  | "PAYROLL"
  | "OPERATIONAL";

export interface AuthUser {
  id: string;

  companyId: string;

  branchId?: string | null;

  companyPrefix: string;

  username: string;

  loginId: string;

  name: string;

  email: string;

  role: AuthUserRole;

  active: boolean;

  createdAt: string;

  updatedAt: string;
}