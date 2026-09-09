export const OPERATIONAL_EMPLOYEE_STATUSES = ["ACTIVE", "ON_LEAVE"] as const;
export const ACTIVE_EMPLOYEE_STATUSES = ["ACTIVE"] as const;

export type EligibleEmployeeStatus = (typeof OPERATIONAL_EMPLOYEE_STATUSES)[number];

export function isOperationallyEligibleEmployee(input: { active: boolean; status: string }): boolean {
  return input.active && OPERATIONAL_EMPLOYEE_STATUSES.includes(input.status as EligibleEmployeeStatus);
}

export function employeeEligibilityStateWhere(
  statuses: readonly EligibleEmployeeStatus[] = OPERATIONAL_EMPLOYEE_STATUSES,
) {
  return {
    active: true,
    status: { in: [...statuses] },
  };
}

export function employeeEligibilityWhere(
  companyId: string,
  statuses: readonly EligibleEmployeeStatus[] = OPERATIONAL_EMPLOYEE_STATUSES,
) {
  return {
    companyId,
    ...employeeEligibilityStateWhere(statuses),
  };
}

export function employeeEligibilityByIdWhere(
  companyId: string,
  employeeId: string,
  statuses: readonly EligibleEmployeeStatus[] = OPERATIONAL_EMPLOYEE_STATUSES,
) {
  return {
    id: employeeId,
    ...employeeEligibilityWhere(companyId, statuses),
  };
}
