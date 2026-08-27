export interface DepartmentProps {
  id: string;
  companyId: string;
  branchId?: string | null;
  name: string;
  code?: string | null;
  active: boolean;
  managerEmployeeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Department {
  private constructor(private readonly props: DepartmentProps) {}

  static create(props: DepartmentProps) {
    if (!props.name.trim()) {
      throw new Error("Department name is required");
    }

    return new Department(props);
  }

  get id() {
    return this.props.id;
  }

  get companyId() {
    return this.props.companyId;
  }

  get name() {
    return this.props.name;
  }

  toJSON(): DepartmentProps {
    return { ...this.props };
  }
}
