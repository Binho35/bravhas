export type ObligationPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ObligationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELED";

export type ObligationArea =
  | "FINANCIAL"
  | "HR"
  | "PAYROLL"
  | "COMPLIANCE"
  | "ADMINISTRATIVE";

export interface ObligationProps {
  id: string;

  title: string;

  description?: string | null;

  area: ObligationArea;

  priority: ObligationPriority;

  status: ObligationStatus;

  responsibleId?: string | null;

  responsibleName?: string | null;

  dueDate: Date;

  completedAt?: Date | null;

  notes?: string | null;

  createdAt: Date;

  updatedAt: Date;
}

export class Obligation {
  constructor(
    private readonly props: ObligationProps,
  ) {
    this.validate();
  }

  get data(): ObligationProps {
    return {
      ...this.props,
    };
  }

  private validate(): void {
    if (!this.props.id.trim()) {
      throw new Error(
        "A obrigação deve possuir um identificador.",
      );
    }

    if (!this.props.title.trim()) {
      throw new Error(
        "O título da obrigação é obrigatório.",
      );
    }

    if (
      Number.isNaN(
        this.props.dueDate.getTime(),
      )
    ) {
      throw new Error(
        "A data de vencimento da obrigação é inválida.",
      );
    }
  }

  updateStatus(
    status: ObligationStatus,
  ): Obligation {
    const completedAt =
      status === "COMPLETED"
        ? new Date()
        : null;

    return new Obligation({
      ...this.props,

      status,

      completedAt,

      updatedAt: new Date(),
    });
  }

  updatePriority(
    priority: ObligationPriority,
  ): Obligation {
    return new Obligation({
      ...this.props,

      priority,

      updatedAt: new Date(),
    });
  }

  updateResponsible(
    responsibleId: string | null,
    responsibleName: string | null,
  ): Obligation {
    return new Obligation({
      ...this.props,

      responsibleId,

      responsibleName,

      updatedAt: new Date(),
    });
  }

  updateDueDate(
    dueDate: Date,
  ): Obligation {
    if (
      Number.isNaN(
        dueDate.getTime(),
      )
    ) {
      throw new Error(
        "A nova data de vencimento é inválida.",
      );
    }

    return new Obligation({
      ...this.props,

      dueDate,

      updatedAt: new Date(),
    });
  }

  updateNotes(
    notes: string | null,
  ): Obligation {
    return new Obligation({
      ...this.props,

      notes,

      updatedAt: new Date(),
    });
  }

  isOverdue(
    referenceDate: Date = new Date(),
  ): boolean {
    if (
      this.props.status ===
        "COMPLETED" ||
      this.props.status ===
        "CANCELED"
    ) {
      return false;
    }

    return (
      this.props.dueDate.getTime() <
      referenceDate.getTime()
    );
  }
}