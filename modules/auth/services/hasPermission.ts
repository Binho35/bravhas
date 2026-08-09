import type {
  AuthUser,
} from "../types/AuthUser";

import type {
  PermissionAction,
  PermissionResource,
} from "../domain/Permission";

import {
  getRolePermissions,
} from "./getRolePermissions";

export interface HasPermissionInput {
  user: AuthUser | null;

  resource: PermissionResource;

  action: PermissionAction;
}

export function hasPermission({
  user,
  resource,
  action,
}: HasPermissionInput): boolean {
  if (!user) {
    return false;
  }

  if (!user.active) {
    return false;
  }

  if (
    user.role === "OWNER"
  ) {
    return true;
  }

  const permissions =
    getRolePermissions(
      user.role,
    );

  const permission =
    permissions.find(
      (item) =>
        item.resource ===
        resource,
    );

  if (!permission) {
    return false;
  }

  return permission.actions.includes(
    action,
  );
}