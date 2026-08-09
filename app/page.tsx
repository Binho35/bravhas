"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

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

interface DashboardObligation {
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

const monitoredAreas: {
  area: ObligationArea;
  name: string;
}[] = [
  {
    area: "FINANCIAL",
    name: "Financeiro",
  },
  {
    area: "HR",
    name: "Recursos Humanos",
  },
  {
    area: "PAYROLL",
    name: "Departamento Pessoal",
  },
];

function convertStoredObligation(
  item: StoredObligation,
): DashboardObligation {
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

function normalizeDate(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function getDaysDifference(
  targetDate: Date,
  referenceDate: Date,
): number {
  const target =
    normalizeDate(targetDate);

  const reference =
    normalizeDate(
      referenceDate,
    );

  return Math.round(
    (target.getTime() -
      reference.getTime()) /
      (1000 *
        60 *
        60 *
        24),
  );
}

function formatDeadline(
  dueDate: Date,
  referenceDate: Date,
): string {
  const difference =
    getDaysDifference(
      dueDate,
      referenceDate,
    );

  if (difference < 0) {
    return `${Math.abs(
      difference,
    )}d atrasada`;
  }

  if (difference === 0) {
    return "Hoje";
  }

  if (difference === 1) {
    return "Amanhã";
  }

  if (difference <= 7) {
    return `${difference} dias`;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
    },
  )
    .format(dueDate)
    .replace(".", "")
    .toUpperCase();
}

function calculateAreaHealth(
  obligations: DashboardObligation[],
  area: ObligationArea,
  referenceDate: Date,
): number {
  const areaItems =
    obligations.filter(
      (item) =>
        item.area === area,
    );

  if (
    areaItems.length === 0
  ) {
    return 100;
  }

  const activeItems =
    areaItems.filter(
      (item) =>
        item.status !==
          "COMPLETED" &&
        item.status !==
          "CANCELED",
    );

  const overdue =
    activeItems.filter(
      (item) =>
        getDaysDifference(
          item.dueDate,
          referenceDate,
        ) < 0,
    ).length;

  const critical =
    activeItems.filter(
      (item) =>
        item.priority ===
        "CRITICAL",
    ).length;

  const high =
    activeItems.filter(
      (item) =>
        item.priority ===
        "HIGH",
    ).length;

  const penalty =
    overdue * 18 +
    critical * 8 +
    high * 4;

  return Math.max(
    0,
    Math.min(
      100,
      100 - penalty,
    ),
  );
}

export default function Home() {
  const [
    storedObligations,
    setStoredObligations,
  ] = useState<
    DashboardObligation[]
  >([]);

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

  const referenceDate =
    new Date();

  const activeObligations =
    allObligations.filter(
      (item) =>
        item.status !==
          "COMPLETED" &&
        item.status !==
          "CANCELED",
    );

  const attentionItems =
    [...activeObligations]
      .filter(
        (item) =>
          item.priority ===
            "CRITICAL" ||
          item.priority ===
            "HIGH",
      )
      .sort(
        (a, b) =>
          a.dueDate.getTime() -
          b.dueDate.getTime(),
      );

  const criticalItems =
    attentionItems.filter(
      (item) =>
        item.priority ===
        "CRITICAL",
    );

  const nextSevenDays =
    activeObligations.filter(
      (item) => {
        const difference =
          getDaysDifference(
            item.dueDate,
            referenceDate,
          );

        return (
          difference >= 0 &&
          difference <= 7
        );
      },
    );

  const overdueItems =
    activeObligations.filter(
      (item) =>
        getDaysDifference(
          item.dueDate,
          referenceDate,
        ) < 0,
    );

  const administrativeHealth =
    Math.max(
      0,
      Math.min(
        100,
        100 -
          overdueItems.length *
            12 -
          criticalItems.length *
            5,
      ),
    );

  const areas =
    monitoredAreas.map(
      ({ area, name }) => {
        const areaItems =
          activeObligations.filter(
            (item) =>
              item.area === area,
          );

        const alert =
          areaItems.filter(
            (item) =>
              item.priority ===
                "CRITICAL" ||
              item.priority ===
                "HIGH",
          ).length;

        return {
          area,

          name,

          health:
            calculateAreaHealth(
              allObligations,
              area,
              referenceDate,
            ),

          pending:
            areaItems.length,

          alert,
        };
      },
    );

  const upcomingItems =
    [...activeObligations]
      .sort(
        (a, b) =>
          a.dueDate.getTime() -
          b.dueDate.getTime(),
      )
      .slice(0, 4);

  const firstPriority =
    attentionItems[0];

  const secondPriority =
    attentionItems[1];

  return (
    <AppShell
      sidebar={<Sidebar />}
      header={<Header />}
    >
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4 overflow-hidden p-5">
        {/* APRESENTAÇÃO */}
        <section className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0B2947]">
              Bom dia.
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Existem{" "}
              <span className="font-semibold text-[#DC2626]">
                {
                  attentionItems.length
                }{" "}
                situações
              </span>{" "}
              que exigem sua atenção
              administrativa.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs text-[#64748B] xl:flex">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />

            Operação acompanhada
          </div>
        </section>

        {/* INDICADORES */}
        <section className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Obrigações abertas
            </p>

            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-[#0B2947]">
                {
                  activeObligations.length
                }
              </span>

              <span className="text-[11px] font-semibold text-[#2563EB]">
                Em andamento
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Exigem atenção
            </p>

            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-[#DC2626]">
                {
                  attentionItems.length
                }
              </span>

              <span className="text-[11px] font-semibold text-[#DC2626]">
                Prioridade
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Próximos 7 dias
            </p>

            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-[#0B2947]">
                {
                  nextSevenDays.length
                }
              </span>

              <span className="text-[11px] font-semibold text-[#D97706]">
                Vencimentos
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Saúde administrativa
            </p>

            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-[#154B7A]">
                {
                  administrativeHealth
                }
                %
              </span>

              <span
                className={`text-[11px] font-semibold ${
                  administrativeHealth >=
                  90
                    ? "text-[#16A34A]"
                    : administrativeHealth >=
                        75
                      ? "text-[#D97706]"
                      : "text-[#DC2626]"
                }`}
              >
                {administrativeHealth >=
                90
                  ? "Estável"
                  : administrativeHealth >=
                      75
                    ? "Atenção"
                    : "Crítico"}
              </span>
            </div>
          </div>
        </section>

        {/* CONTEÚDO PRINCIPAL */}
        <section className="grid min-h-0 grid-cols-[1.35fr_0.85fr] gap-4">
          {/* ESQUERDA */}
          <div className="grid min-h-0 grid-rows-[1fr_auto] gap-4">
            <div className="min-h-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0B2947]">
                    Decisões de hoje
                  </h3>

                  <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                    Itens que precisam de
                    ação ou acompanhamento.
                  </p>
                </div>

                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                  {
                    criticalItems.length
                  }{" "}
                  {criticalItems.length ===
                  1
                    ? "crítica"
                    : "críticas"}
                </span>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {attentionItems
                  .slice(0, 4)
                  .map((item) => (
                    <a
                      key={item.id}
                      href={`/obrigacoes/${item.id}`}
                      className="flex items-center justify-between px-4 py-3 transition hover:bg-[#F8FAFC]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            item.priority ===
                            "CRITICAL"
                              ? "bg-[#DC2626]"
                              : "bg-[#D97706]"
                          }`}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#0F172A]">
                            {item.title}
                          </p>

                          <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                            {
                              areaLabels[
                                item.area
                              ]
                            }{" "}
                            •{" "}
                            {
                              item.responsibleName
                            }
                          </p>
                        </div>
                      </div>

                      <span
                        className={`ml-4 shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                          getDaysDifference(
                            item.dueDate,
                            referenceDate,
                          ) < 0
                            ? "bg-red-50 text-[#DC2626]"
                            : "bg-[#F8FAFC] text-[#475569]"
                        }`}
                      >
                        {formatDeadline(
                          item.dueDate,
                          referenceDate,
                        )}
                      </span>
                    </a>
                  ))}
              </div>
            </div>

            {/* ÁREAS */}
            <div className="grid grid-cols-3 gap-3">
              {areas.map((area) => (
                <div
                  key={area.area}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#0B2947]">
                        {area.name}
                      </p>

                      <p className="mt-1 text-[11px] text-[#94A3B8]">
                        {area.pending}{" "}
                        {area.pending === 1
                          ? "obrigação aberta"
                          : "obrigações abertas"}
                      </p>
                    </div>

                    <span className="text-lg font-bold text-[#154B7A]">
                      {area.health}%
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAF3FB]">
                    <div
                      className="h-full rounded-full bg-[#154B7A]"
                      style={{
                        width: `${area.health}%`,
                      }}
                    />
                  </div>

                  <p
                    className={`mt-3 text-[11px] font-semibold ${
                      area.alert > 0
                        ? "text-[#D97706]"
                        : "text-[#16A34A]"
                    }`}
                  >
                    {area.alert > 0
                      ? `${area.alert} ${
                          area.alert === 1
                            ? "exige"
                            : "exigem"
                        } atenção`
                      : "Sem alertas críticos"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DIREITA */}
          <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
            {/* HARPIA */}
            <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Assistente Executivo
                  </p>

                  <h3 className="mt-1 text-lg font-bold">
                    Harpia
                  </h3>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-bold">
                  H
                </div>
              </div>

              {firstPriority ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-white/75">
                    Sugiro começar por{" "}
                    <span className="font-semibold text-white">
                      {
                        firstPriority.title
                      }
                    </span>
                    {secondPriority
                      ? ` e depois acompanhar ${secondPriority.title.toLowerCase()}.`
                      : "."}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
                    <span className="h-2 w-2 rounded-full bg-[#8CC4EA]" />

                    {
                      attentionItems.length
                    }{" "}
                    {attentionItems.length ===
                    1
                      ? "prioridade identificada"
                      : "prioridades identificadas"}
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-4 text-sm leading-6 text-white/75">
                    Não existem
                    prioridades críticas ou
                    altas neste momento.
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
                    <span className="h-2 w-2 rounded-full bg-[#16A34A]" />

                    Operação sob controle
                  </div>
                </>
              )}
            </div>

            {/* AGENDA */}
            <div className="min-h-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="border-b border-[#E2E8F0] px-4 py-3">
                <h3 className="text-sm font-bold text-[#0B2947]">
                  Próximas obrigações
                </h3>

                <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                  Agenda administrativa
                  consolidada.
                </p>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {upcomingItems.map(
                  (item) => (
                    <a
                      key={item.id}
                      href={`/obrigacoes/${item.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#F8FAFC]"
                    >
                      <div
                        className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-xl px-2 text-center text-[10px] font-bold ${
                          getDaysDifference(
                            item.dueDate,
                            referenceDate,
                          ) < 0
                            ? "bg-red-50 text-[#DC2626]"
                            : "bg-[#EAF3FB] text-[#154B7A]"
                        }`}
                      >
                        {formatDeadline(
                          item.dueDate,
                          referenceDate,
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">
                          {item.title}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                          {
                            areaLabels[
                              item.area
                            ]
                          }{" "}
                          •{" "}
                          {
                            item.responsibleName
                          }
                        </p>
                      </div>
                    </a>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}