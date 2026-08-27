import type { Employee } from "../entities/Employee";

export interface EmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  listByCompany(companyId: string): Promise<Employee[]>;
  save(employee: Employee): Promise<void>;
}
