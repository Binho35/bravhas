export type FinancialAccountType =
  | "PAYABLE"
  | "RECEIVABLE";

export type FinancialAccountStatus =
  | "OPEN"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELED";

export interface FinancialAccountProps {
  id: string;

  companyId: string;

  branchId: string;

  costCenterId?: string | null;

  categoryId?: string | null;

  supplierId?: string | null;

  customerId?: string | null;

  bankAccountId?: string | null;

  type: FinancialAccountType;

  status: FinancialAccountStatus;

  description: string;

  documentNumber?: string | null;

  issueDate: Date;

  dueDate: Date;

  paymentDate?: Date | null;

  amount: number;

  paidAmount: number;

  discount: number;

  interest: number;

  fine: number;

  notes?: string | null;

  createdBy: string;

  updatedBy?: string | null;

  createdAt: Date;

  updatedAt: Date;
}

export class FinancialAccount {
  constructor(
    private readonly props: FinancialAccountProps,
  ) {}

  get data(): FinancialAccountProps {
    return this.props;
  }

  get outstandingAmount(): number {
    const total =
      this.props.amount -
      this.props.discount +
      this.props.interest +
      this.props.fine -
      this.props.paidAmount;

    return Number(
      total.toFixed(2),
    );
  }

  get isPaid(): boolean {
    return (
      this.props.status === "PAID"
    );
  }

  get isOpen(): boolean {
    return (
      this.props.status === "OPEN" ||
      this.props.status ===
        "PARTIALLY_PAID"
    );
  }

  get isOverdue(): boolean {
    if (
      this.props.status === "PAID" ||
      this.props.status === "CANCELED"
    ) {
      return false;
    }

    return (
      this.props.dueDate.getTime() <
      Date.now()
    );
  }

  updateStatus(
    status: FinancialAccountStatus,
  ): FinancialAccount {
    return new FinancialAccount({
      ...this.props,

      status,

      updatedAt: new Date(),
    });
  }

  registerPayment(
    amount: number,
    paymentDate: Date,
  ): FinancialAccount {
    if (amount <= 0) {
      throw new Error(
        "O valor do pagamento deve ser maior que zero.",
      );
    }

    if (this.props.status === "CANCELED") {
      throw new Error(
        "Não é possível registrar pagamento em uma conta cancelada.",
      );
    }

    if (this.props.status === "PAID") {
      throw new Error(
        "Não é possível registrar pagamento em uma conta já quitada.",
      );
    }

    if (amount > this.outstandingAmount) {
      throw new Error(
        "O valor do pagamento não pode ser maior que o saldo em aberto.",
      );
    }

    const paidAmount =
      this.props.paidAmount +
      amount;

    const totalAmount =
      this.props.amount -
      this.props.discount +
      this.props.interest +
      this.props.fine;

    const status =
      paidAmount >= totalAmount
        ? "PAID"
        : "PARTIALLY_PAID";

    return new FinancialAccount({
      ...this.props,

      paidAmount,

      paymentDate,

      status,

      updatedAt: new Date(),
    });
  }

  cancel(): FinancialAccount {
    if (this.props.status === "PAID") {
      throw new Error(
        "Não é possível cancelar uma conta já quitada.",
      );
    }

    if (this.props.status === "CANCELED") {
      return this;
    }

    return new FinancialAccount({
      ...this.props,

      status: "CANCELED",

      updatedAt: new Date(),
    });
  }

  update(
    data: Partial<FinancialAccountProps>,
  ): FinancialAccount {
    return new FinancialAccount({
      ...this.props,

      ...data,

      updatedAt: new Date(),
    });
  }
}