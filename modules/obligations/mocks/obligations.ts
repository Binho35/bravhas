import {
  ObligationArea,
  ObligationPriority,
  ObligationStatus,
} from "../domain/entities/Obligation";

export interface ObligationMock {
  id: string;

  title: string;

  description?: string;

  area: ObligationArea;

  priority: ObligationPriority;

  status: ObligationStatus;

  responsibleId: string;

  responsibleName: string;

  dueDate: Date;

  completedAt: Date | null;

  notes: string | null;

  createdAt: Date;

  updatedAt: Date;
}

export const obligations: ObligationMock[] = [
  {
    id: "OBG-0001",
    title: "Conferir recebimentos previstos",
    description:
      "Validar os recebimentos programados para os dias 5 e 20.",

    area: "FINANCIAL",

    priority: "CRITICAL",

    status: "PENDING",

    responsibleId: "USR-001",

    responsibleName: "Robson",

    dueDate: new Date("2026-08-10"),

    completedAt: null,

    notes: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "OBG-0002",

    title: "Conciliação bancária",

    description:
      "Conferir entradas, saídas e saldo bancário.",

    area: "FINANCIAL",

    priority: "HIGH",

    status: "IN_PROGRESS",

    responsibleId: "USR-001",

    responsibleName: "Robson",

    dueDate: new Date("2026-08-11"),

    completedAt: null,

    notes: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "OBG-0003",

    title: "Programação de férias",

    description:
      "Conferir colaboradores com férias próximas.",

    area: "HR",

    priority: "MEDIUM",

    status: "PENDING",

    responsibleId: "USR-002",

    responsibleName: "Departamento RH",

    dueDate: new Date("2026-08-15"),

    completedAt: null,

    notes: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "OBG-0004",

    title: "Fechamento da folha",

    description:
      "Validar todas as informações antes do envio à contabilidade.",

    area: "PAYROLL",

    priority: "CRITICAL",

    status: "PENDING",

    responsibleId: "USR-003",

    responsibleName: "Departamento Pessoal",

    dueDate: new Date("2026-08-09"),

    completedAt: null,

    notes: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "OBG-0005",

    title: "Atualizar contratos administrativos",

    description:
      "Revisar contratos com vencimento próximo.",

    area: "COMPLIANCE",

    priority: "HIGH",

    status: "IN_PROGRESS",

    responsibleId: "USR-004",

    responsibleName: "Compliance",

    dueDate: new Date("2026-08-18"),

    completedAt: null,

    notes: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },

  {
    id: "OBG-0006",

    title: "Arquivar comprovantes",

    description:
      "Garantir documentação dos pagamentos realizados.",

    area: "ADMINISTRATIVE",

    priority: "LOW",

    status: "PENDING",

    responsibleId: "USR-005",

    responsibleName: "Administrativo",

    dueDate: new Date("2026-08-20"),

    completedAt: null,

    notes: null,

    createdAt: new Date(),

    updatedAt: new Date(),
  },
];