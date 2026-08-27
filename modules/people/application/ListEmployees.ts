import type { EmployeeRepository } from "../domain/repositories/EmployeeRepository";

export class ListEmployees {
  constructor(private readonly employees: EmployeeRepository) {}

  execute(companyId: string) {
    return this.employees.listByCompany(companyId);
  }
}
