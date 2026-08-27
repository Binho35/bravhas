import { randomUUID } from "node:crypto";

import { Employee, type EmploymentStatus } from "../domain/entities/Employee";
import type { EmployeeRepository } from "../domain/repositories/EmployeeRepository";

export interface CreateEmployeeInput {
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  employeeNumber?: string | null;
  fullName: string;
  preferredName?: string | null;
  corporateEmail?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  documentCpf?: string | null;
  admissionDate?: Date | null;
  status?: EmploymentStatus;
}

export class CreateEmployee {
  constructor(private readonly employees: EmployeeRepository) {}

  async execute(input: CreateEmployeeInput) {
    const now = new Date();

    const employee = Employee.create({
      id: randomUUID(),
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      departmentId: input.departmentId ?? null,
      managerId: input.managerId ?? null,
      employeeNumber: input.employeeNumber ?? null,
      fullName: input.fullName,
      preferredName: input.preferredName ?? null,
      corporateEmail: input.corporateEmail ?? null,
      personalEmail: input.personalEmail ?? null,
      phone: input.phone ?? null,
      documentCpf: input.documentCpf ?? null,
      admissionDate: input.admissionDate ?? null,
      terminationDate: null,
      status: input.status ?? "PRE_ADMISSION",
      createdAt: now,
      updatedAt: now,
    });

    await this.employees.save(employee);

    return employee;
  }
}
