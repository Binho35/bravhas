export type EmploymentStatus =
  | "PRE_ADMISSION"
  | "ACTIVE"
  | "ON_LEAVE"
  | "TERMINATED";

export interface EmployeeProps {
  id: string;
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
  terminationDate?: Date | null;
  status: EmploymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Employee {
  private constructor(private readonly props: EmployeeProps) {}

  static create(props: EmployeeProps) {
    if (!props.fullName.trim()) {
      throw new Error("Employee fullName is required");
    }

    return new Employee(props);
  }

  get id() {
    return this.props.id;
  }

  get companyId() {
    return this.props.companyId;
  }

  get fullName() {
    return this.props.fullName;
  }

  get status() {
    return this.props.status;
  }

  toJSON(): EmployeeProps {
    return { ...this.props };
  }
}
