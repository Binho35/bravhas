import type {
  AuthUserRole,
} from "../types/AuthUser";

import type {
  PermissionAction,
  PermissionResource,
} from "../domain/Permission";

export interface RolePermission {
  resource: PermissionResource;

  actions: PermissionAction[];
}

const OWNER_PERMISSIONS: RolePermission[] = [
  {
    resource: "DASHBOARD",
    actions: [
      "VIEW",
      "CREATE",
      "EDIT",
      "DELETE",
      "APPROVE",
      "EXPORT",
      "MANAGE",
    ],
  },
  {
    resource: "FINANCIAL",
    actions: [
      "VIEW",
      "CREATE",
      "EDIT",
      "DELETE",
      "APPROVE",
      "EXPORT",
      "MANAGE",
    ],
  },
  {
    resource: "CASH_FLOW",
    actions: [
      "VIEW",
      "CREATE",
      "EDIT",
      "EXPORT",
    ],
  },
  {
    resource: "USERS",
    actions: [
      "VIEW",
      "CREATE",
      "EDIT",
      "DELETE",
      "MANAGE",
    ],
  },
  {
    resource: "SETTINGS",
    actions: [
      "VIEW",
      "EDIT",
      "MANAGE",
    ],
  },
];

const ADMIN_PERMISSIONS: RolePermission[] = [
  ...OWNER_PERMISSIONS,
];

const FINANCIAL_PERMISSIONS: RolePermission[] = [
  {
    resource: "FINANCIAL",
    actions: [
      "VIEW",
      "CREATE",
      "EDIT",
      "APPROVE",
      "EXPORT",
    ],
  },
  {
    resource: "CASH_FLOW",
    actions: [
      "VIEW",
      "EXPORT",
    ],
  },
];

const HR_PERMISSIONS: RolePermission[] = [
  {
    resource: "PEOPLE",
    actions: [
      "VIEW",
      "CREATE",
      "EDIT",
    ],
  },
  {
    resource: "PAYROLL",
    actions: [
      "VIEW",
      "CREATE",
      "EDIT",
      "APPROVE",
    ],
  },
];

const PAYROLL_PERMISSIONS: RolePermission[] = [
  ...HR_PERMISSIONS,
];

const OPERATIONAL_PERMISSIONS: RolePermission[] = [
  {
    resource: "DASHBOARD",
    actions: [
      "VIEW",
    ],
  },
];

export function getRolePermissions(
  role: AuthUserRole,
): RolePermission[] {
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