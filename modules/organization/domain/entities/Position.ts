export interface PositionProps {
  id: string;
  companyId: string;
  departmentId?: string | null;
  title: string;
  code?: string | null;
  cbo?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Position {
  private constructor(private readonly props: PositionProps) {}

  static create(props: PositionProps) {
    if (!props.title.trim()) {
      throw new Error("Position title is required");
    }

    return new Position(props);
  }

  get id() {
    return this.props.id;
  }

  get companyId() {
    return this.props.companyId;
  }

  get title() {
    return this.props.title;
  }

  toJSON(): PositionProps {
    return { ...this.props };
  }
}
