import type {
  FinancialAccountStatus,
  FinancialAccountType,
} from "../domain/entities/FinancialAccount";

export interface FinancialAccountMock {
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

export const financialAccounts: FinancialAccountMock[] = [
  {
    id: "FIN-0001",

    companyId: "COMP-001",

    branchId: "BRANCH-001",

    costCenterId: "CC-ADM",

    categoryId: "CAT-FORNECEDORES",

    supplierId: "SUP-001",

    customerId: null,

    bankAccountId: "BANK-001",

    type: "PAYABLE",

    status: "OPEN",

    description:
      "Pagamento fornecedor de serviços administrativos",

    documentNumber: "NF-1458",

    issueDate: new Date(
      "2026-08-01T12:00:00",
    ),

    dueDate: new Date(
      "2026-08-10T12:00:00",
    ),

    paymentDate: null,

    amount: 4850,

    paidAmount: 0,

    discount: 0,

    interest: 0,

    fine: 0,

    notes:
      "Pagamento sujeito à conferência da nota fiscal.",

    createdBy: "Robson",

    updatedBy: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "FIN-0002",

    companyId: "COMP-001",

    branchId: "BRANCH-001",

    costCenterId: "CC-PESSOAL",

    categoryId: "CAT-FOLHA",

    supplierId: null,

    customerId: null,

    bankAccountId: "BANK-001",

    type: "PAYABLE",

    status: "OPEN",

    description:
      "Provisionamento da folha de pagamento",

    documentNumber: null,

    issueDate: new Date(
      "2026-08-05T12:00:00",
    ),

    dueDate: new Date(
      "2026-08-15T12:00:00",
    ),

    paymentDate: null,

    amount: 38500,

    paidAmount: 0,

    discount: 0,

    interest: 0,

    fine: 0,

    notes:
      "Valor demonstrativo para composição do caixa projetado.",

    createdBy: "Robson",

    updatedBy: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "FIN-0003",

    companyId: "COMP-001",

    branchId: "BRANCH-001",

    costCenterId: "CC-TRIBUTOS",

    categoryId: "CAT-TRIBUTOS",

    supplierId: null,

    customerId: null,

    bankAccountId: "BANK-001",

    type: "PAYABLE",

    status: "OPEN",

    description:
      "Guia tributária mensal",

    documentNumber: "GUIA-082026",

    issueDate: new Date(
      "2026-08-06T12:00:00",
    ),

    dueDate: new Date(
      "2026-08-20T12:00:00",
    ),

    paymentDate: null,

    amount: 12750,

    paidAmount: 0,

    discount: 0,

    interest: 0,

    fine: 0,

    notes:
      "Aguardar validação final da contabilidade.",

    createdBy: "Robson",

    updatedBy: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "FIN-0004",

    companyId: "COMP-001",

    branchId: "BRANCH-001",

    costCenterId: "CC-OPERACIONAL",

    categoryId: "CAT-RECEBIMENTOS",

    supplierId: null,

    customerId: "CLI-001",

    bankAccountId: "BANK-001",

    type: "RECEIVABLE",

    status: "OPEN",

    description:
      "Recebimento previsto — carteira contratual",

    documentNumber: "REC-0508",

    issueDate: new Date(
      "2026-08-01T12:00:00",
    ),

    dueDate: new Date(
      "2026-08-05T12:00:00",
    ),

    paymentDate: null,

    amount: 58200,

    paidAmount: 0,

    discount: 0,

    interest: 0,

    fine: 0,

    notes:
      "Recebimento previsto para conferência bancária.",

    createdBy: "Robson",

    updatedBy: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "FIN-0005",

    companyId: "COMP-001",

    branchId: "BRANCH-001",

    costCenterId: "CC-OPERACIONAL",

    categoryId: "CAT-RECEBIMENTOS",

    supplierId: null,

    customerId: "CLI-002",

    bankAccountId: "BANK-001",

    type: "RECEIVABLE",

    status: "OPEN",

    description:
      "Recebimento previsto — segunda quinzena",

    documentNumber: "REC-2008",

    issueDate: new Date(
      "2026-08-05T12:00:00",
    ),

    dueDate: new Date(
      "2026-08-20T12:00:00",
    ),

    paymentDate: null,

    amount: 62400,

    paidAmount: 0,

    discount: 0,

    interest: 0,

    fine: 0,

    notes:
      "Recebimento previsto para o dia 20.",

    createdBy: "Robson",

    updatedBy: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "FIN-0006",

    companyId: "COMP-001",

    branchId: "BRANCH-001",

    costCenterId: "CC-FORNECEDORES",

    categoryId: "CAT-FORNECEDORES",

    supplierId: "SUP-002",

    customerId: null,

    bankAccountId: "BANK-001",

    type: "PAYABLE",

    status: "PAID",

    description:
      "Fornecedor de tecnologia",

    documentNumber: "NF-9981",

    issueDate: new Date(
      "2026-07-25T12:00:00",
    ),

    dueDate: new Date(
      "2026-08-05T12:00:00",
    ),

    paymentDate: new Date(
      "2026-08-05T12:00:00",
    ),

    amount: 3200,

    paidAmount: 3200,

    discount: 0,

    interest: 0,

    fine: 0,

    notes:
      "Pagamento concluído.",

    createdBy: "Robson",

    updatedBy: "Robson",

    createdAt: new Date(),

    updatedAt: new Date(),
  },
];