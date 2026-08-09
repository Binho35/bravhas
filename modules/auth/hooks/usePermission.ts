"use client";

import type {
  PermissionAction,
  PermissionResource,
} from "../domain/Permission";

import {
  hasPermission,
} from "../services/hasPermission";

import {
  useAuth,
} from "./useAuth";

export function usePermission(
  resource: PermissionResource,
  action: PermissionAction,
): boolean {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return false;
  }

  return hasPermission({
    user,
    resource,
    action,
  });
}