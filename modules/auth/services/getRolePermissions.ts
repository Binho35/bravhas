import type { AuthUserRole } from "../types/AuthUser";
import type { PermissionAction, PermissionResource } from "../domain/Permission";

export interface RolePermission {
  resource: PermissionResource;
  actions: PermissionAction[];
}

const FULL_ACTIONS: PermissionAction[] = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "EXPORT", "MANAGE"];
const READ_WRITE_ACTIONS: PermissionAction[] = ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"];

function full(resource: PermissionResource): RolePermission {
  return { resource, actions: [...FULL_ACTIONS] };
}

const OWNER_PERMISSIONS: RolePermission[] = [
  full("DASHBOARD"),
  full("OBLIGATIONS"),
  full("AGENDA"),
  full("FINANCIAL"),
  full("CASH_FLOW"),
  full("PEOPLE"),
  full("PAYROLL"),
  full("INDICATORS"),
  full("DOCUMENTS"),
  full("USERS"),
  full("SETTINGS"),
];

const ADMIN_PERMISSIONS: RolePermission[] = OWNER_PERMISSIONS.map((permission) => ({
  resource: permission.resource,
  actions: [...permission.actions],
}));

const FINANCIAL_PERMISSIONS: RolePermission[] = [
  { resource: "FINANCIAL", actions: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"] },
  { resource: "CASH_FLOW", actions: ["VIEW", "EXPORT"] },
];

const HR_PERMISSIONS: RolePermission[] = [
  { resource: "PEOPLE", actions: [...READ_WRITE_ACTIONS] },
];

const PAYROLL_PERMISSIONS: RolePermission[] = [
  { resource: "PAYROLL", actions: [...READ_WRITE_ACTIONS] },
];

const OPERATIONAL_PERMISSIONS: RolePermission[] = [
  { resource: "DASHBOARD", actions: ["VIEW"] },
];

export function getRolePermissions(role: AuthUserRole): RolePermission[] {
  switch (role) {
    case "OWNER":
      return OWNER_PERMISSIONS;
    case "ADMIN":
      return ADMIN_PERMISSIONS;
    case "FINANCIAL":
      return FINANCIAL_PERMISSIONS;
    case "HR":
      return HR_PERMISSIONS;
    case "PAYROLL":
      return PAYROLL_PERMISSIONS;
    case "OPERATIONAL":
      return OPERATIONAL_PERMISSIONS;
    default:
      return [];
  }
}
