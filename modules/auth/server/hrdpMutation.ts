import type { AuthUserRole } from "../types/AuthUser";
import { requireServerRole } from "./session";

const DEFAULT_HRDP_MUTATION_ROLES: AuthUserRole[] = ["OWNER", "ADMIN", "HR", "PAYROLL"];

export async function authorizeHrdpMutation(roles: AuthUserRole[] = DEFAULT_HRDP_MUTATION_ROLES) {
  return requireServerRole(roles);
}