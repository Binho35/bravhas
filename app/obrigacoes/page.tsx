"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";

import { obligations as mockObligations } from "@/modules/obligations/mocks/obligations";

import {
  getStoredObligations,
  type StoredObligation,
} from "@/modules/obligations/storage/obligationStorage";

import type {
  ObligationArea,
  ObligationPriority,
  ObligationStatus,
} from "@/modules/obligations/domain/entities/Obligation";

interface ObligationListItem {
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

type AreaFilter =
  | "ALL"
  | ObligationArea;

interface FilterOption {
  label: string;
  value: AreaFilter;
}

const areaLabels: Record<
  ObligationArea,
  string
> = {
  FINANCIAL: "Financeiro",

  HR: "Recursos Humanos",

  PAYROLL: "Departamento Pessoal",

  COMPLIANCE: "Compliance",

  ADMINISTRATIVE: "Administrativo",
};

const filterOptions: FilterOption[] = [
  {
    label: "Todas",
    value: "ALL",
  },
  {
    label: "Financeiro",
    value: "FINANCIAL",
  },
  {
    label: "RH",
    value: "HR",
  },
  {
    label: "DP",
    value: "PAYROLL",
  },
  {
    label: "Compliance",
    value: "COMPLIANCE",
  },
  {
    label: "Administrativo",
    value: "ADMINISTRATIVE",
  },
];

const priorityLabels: Record<
  ObligationPriority,
  string
> = {
  LOW: "Baixa",

  MEDIUM: "Média",

  HIGH: "Alta",

  CRITICAL: "Crítica",
};

const statusLabels: Record<
  ObligationStatus,
  string
> = {
  PENDING: "Pendente",

  IN_PROGRESS: "Em andamento",

  COMPLETED: "Concluída",

  OVERDUE: "Atrasada",

  CANCELED: "Cancelada",
};

const priorityStyles: Record<
  ObligationPriority,
  string
> = {
  LOW: "bg-slate-100 text-slate-600",

  MEDIUM:
    "bg-amber-50 text-amber-700",

  HIGH:
    "bg-orange-50 text-orange-700",

  CRITICAL:
    "bg-red-50 text-red-700",
};

const statusStyles: Record<
  ObligationStatus,
  string
> = {
  PENDING:
    "bg-slate-100 text-slate-700",

  IN_PROGRESS:
    "bg-blue-50 text-blue-700",

  COMPLETED:
    "bg-green-50 text-green-700",

  OVERDUE:
    "bg-red-50 text-red-700",

  CANCELED:
    "bg-slate-100 text-slate-500",
};

function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
}

function isOverdue(
  dueDate: Date,
  status: ObligationStatus,
): boolean {
  if (
    status === "COMPLETED" ||
    status === "CANCELED"
  ) {
    return false;
  }

  return (
    dueDate.getTime() <
    new Date().getTime()
  );
}

function convertStoredObligation(
  item: StoredObligation,
): ObligationListItem {
  return {
    ...item,

    dueDate: new Date(
      item.dueDate,
    ),

    completedAt:
      item.completedAt
        ? new Date(
            item.completedAt,
          )
        : null,

    createdAt: new Date(
      item.createdAt,
    ),

    updatedAt: new Date(
      item.updatedAt,
    ),
  };
}

export default function ObligationsPage() {
  const router = useRouter();

  const [
    storedObligations,
    setStoredObligations,
  ] = useState<
    ObligationListItem[]
  >([]);

  const [
    selectedArea,
    setSelectedArea,
  ] =
    useState<AreaFilter>("ALL");

  useEffect(() => {
    const stored =
      getStoredObligations().map(
        convertStoredObligation,
      );

    setStoredObligations(
      stored,
    );
  }, []);

  const allObligations =
    useMemo(
      () => [
        ...mockObligations,
        ...storedObligations,
      ],
      [storedObligations],
    );

  const filteredObligations =
    useMemo(() => {
      if (
        selectedArea === "ALL"
      ) {
        return allObligations;
      }

      return allObligations.filter(
        (item) =>
          item.area ===
          selectedArea,
      );
    }, [
      allObligations,
      selectedArea,
    ]);

  const activeObligations =
    filteredObligations.filter(
      (item) =>
        item.status !==
          "COMPLETED" &&
        item.status !==
          "CANCELED",
    );

  const criticalCount =
    activeObligations.filter(
      (item) =>
        item.priority ===
        "CRITICAL",
    ).length;

  const highCount =
    activeObligations.filter(
      (item) =>
        item.priority ===
        "HIGH",
    ).length;

  const overdueCount =
    activeObligations.filter(
      (item) =>
        isOverdue(
          item.dueDate,
          item.status,
        ),
    ).length;

  const currentFilter =
    filterOptions.find(
      (filter) =>
        filter.value ===
        selectedArea,
    );

  return (
    <PermissionGuard
      resource="OBLIGATIONS"
      action="VIEW"
    >
      <AppShell
      sidebar={<Sidebar />}
      header={<Header />}
    >
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4 overflow-hidden p-5">
        {/* CABEÇALHO */}
        <section className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Gestão Administrativa
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">
              Obrigações
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Controle consolidado
              das responsabilidades
              administrativas.
            </p>
          </div>

          <Link
            href="/obrigacoes/nova"
            className="rounded-xl bg-[#154B7A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103D65]"
          >
            + Nova obrigação
          </Link>
        </section>

        {/* INDICADORES */}
        <section className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-[#64748B]">
                  Em aberto
                </p>

                <p className="mt-2 text-2xl font-bold text-[#0B2947]">
                  {
                    activeObligations.length
                  }
                </p>
              </div>

              {selectedArea !==
                "ALL" && (
                <span className="rounded-full bg-[#EAF3FB] px-2 py-1 text-[9px] font-bold text-[#154B7A]">
                  {
                    currentFilter?.label
                  }
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Críticas
            </p>

            <p className="mt-2 text-2xl font-bold text-[#DC2626]">
              {criticalCount}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Alta prioridade
            </p>

            <p className="mt-2 text-2xl font-bold text-[#D97706]">
              {highCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Atrasadas
            </p>

            <p className="mt-2 text-2xl font-bold text-[#DC2626]">
              {overdueCount}
            </p>
          </div>
        </section>

        {/* CENTRAL */}
        <section className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          {/* CABEÇALHO CENTRAL */}
          <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#0B2947]">
                Central de
                Obrigações
              </h3>

              <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                Clique em uma
                obrigação para
                acompanhar ou editar.
              </p>
            </div>

            {/* FILTROS */}
            <div className="flex items-center gap-1.5">
              {filterOptions.map(
                (filter) => {
                  const isActive =
                    selectedArea ===
                    filter.value;

                  const total =
                    filter.value ===
                    "ALL"
                      ? allObligations.length
                      : allObligations.filter(
                          (item) =>
                            item.area ===
                            filter.value,
                        ).length;

                  return (
                    <button
                      key={
                        filter.value
                      }
                      type="button"
                      onClick={() =>
                        setSelectedArea(
                          filter.value,
                        )
                      }
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition ${
                        isActive
                          ? "bg-[#154B7A] text-white shadow-sm"
                          : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#EAF3FB] hover:text-[#154B7A]"
                      }`}
                    >
                      <span>
                        {filter.label}
                      </span>

                      <span
                        className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-white text-[#94A3B8]"
                        }`}
                      >
                        {total}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* TABELA */}
          <div className="min-h-0 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                <tr className="border-b border-[#E2E8F0] text-left">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                    Obrigação
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                    Área
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                    Prioridade
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                    Responsável
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                    Vencimento
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {[...filteredObligations]
                  .sort(
                    (a, b) =>
                      a.dueDate.getTime() -
                      b.dueDate.getTime(),
                  )
                  .map((item) => {
                    const overdue =
                      isOverdue(
                        item.dueDate,
                        item.status,
                      );

                    return (
                      <tr
                        key={item.id}
                        onClick={() =>
                          router.push(
                            `/obrigacoes/${item.id}`,
                          )
                        }
                        className="cursor-pointer border-b border-[#F1F5F9] transition hover:bg-[#F8FAFC]"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-[#0F172A]">
                              {
                                item.title
                              }
                            </p>

                            {item.description && (
                              <p className="mt-0.5 max-w-[320px] truncate text-[11px] text-[#94A3B8]">
                                {
                                  item.description
                                }
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs font-medium text-[#475569]">
                          {
                            areaLabels[
                              item.area
                            ]
                          }
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              priorityStyles[
                                item.priority
                              ]
                            }`}
                          >
                            {
                              priorityLabels[
                                item.priority
                              ]
                            }
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-[#475569]">
                            {
                              item.responsibleName
                            }
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold ${
                              overdue
                                ? "text-[#DC2626]"
                                : "text-[#475569]"
                            }`}
                          >
                            {formatDate(
                              item.dueDate,
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              overdue
                                ? statusStyles.OVERDUE
                                : statusStyles[
                                    item.status
                                  ]
                            }`}
                          >
                            {overdue
                              ? "Atrasada"
                              : statusLabels[
                                  item.status
                                ]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {/* ESTADO VAZIO */}
            {filteredObligations.length ===
              0 && (
              <div className="flex h-40 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-2.5 w-2.5 rounded-full bg-[#16A34A]" />

                  <p className="mt-3 text-sm font-semibold text-[#0B2947]">
                    Nenhuma obrigação
                    encontrada
                  </p>

                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Não existem
                    obrigações cadastradas
                    nesta área.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      </AppShell>
    </PermissionGuard>
  );
}