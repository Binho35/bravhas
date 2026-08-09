"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";
import { obligations as mockObligations } from "@/modules/obligations/mocks/obligations";
import {
  getStoredObligations,
  saveStoredObligations,
} from "@/modules/obligations/storage/obligationStorage";
import type {
  ObligationArea,
  ObligationPriority,
  ObligationStatus,
} from "@/modules/obligations/domain/entities/Obligation";

interface EditableObligation {
  id: string;

  title: string;

  description?: string;

  area: ObligationArea;

  priority: ObligationPriority;

  status: ObligationStatus;

  responsibleId: string;

  responsibleName: string;

  dueDate: string;

  completedAt: string | null;

  notes: string | null;

  createdAt: string;

  updatedAt: string;

  source: "mock" | "stored";
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

export default function ObligationDetailsPage() {
  const params =
    useParams<{ id: string }>();

  const router = useRouter();

  const obligationId = params.id;

  const [
    obligation,
    setObligation,
  ] =
    useState<EditableObligation | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    const stored =
      getStoredObligations();

    const storedMatch =
      stored.find(
        (item) =>
          item.id === obligationId,
      );

    if (storedMatch) {
      setObligation({
        ...storedMatch,

        dueDate: new Date(
          storedMatch.dueDate,
        )
          .toISOString()
          .slice(0, 10),

        source: "stored",
      });

      return;
    }

    const mockMatch =
      mockObligations.find(
        (item) =>
          item.id === obligationId,
      );

    if (mockMatch) {
      setObligation({
        id: mockMatch.id,

        title: mockMatch.title,

        description:
          mockMatch.description,

        area: mockMatch.area,

        priority:
          mockMatch.priority,

        status: mockMatch.status,

        responsibleId:
          mockMatch.responsibleId,

        responsibleName:
          mockMatch.responsibleName,

        dueDate: mockMatch.dueDate
          .toISOString()
          .slice(0, 10),

        completedAt:
          mockMatch.completedAt
            ? mockMatch.completedAt.toISOString()
            : null,

        notes: mockMatch.notes,

        createdAt:
          mockMatch.createdAt.toISOString(),

        updatedAt:
          mockMatch.updatedAt.toISOString(),

        source: "mock",
      });

      return;
    }

    setError(
      "Obrigação não encontrada.",
    );
  }, [obligationId]);

  const statusLabel =
    useMemo(() => {
      if (!obligation) {
        return "";
      }

      return statusLabels[
        obligation.status
      ];
    }, [obligation]);

  const priorityLabel =
    useMemo(() => {
      if (!obligation) {
        return "";
      }

      return priorityLabels[
        obligation.priority
      ];
    }, [obligation]);

  function updateField<
    K extends keyof EditableObligation,
  >(
    field: K,
    value: EditableObligation[K],
  ) {
    if (!obligation) {
      return;
    }

    setObligation({
      ...obligation,

      [field]: value,
    });

    setSaved(false);

    setError(null);
  }

  function validate(): boolean {
    if (!obligation) {
      return false;
    }

    if (!obligation.title.trim()) {
      setError(
        "O título da obrigação é obrigatório.",
      );

      return false;
    }

    if (
      !obligation.responsibleName.trim()
    ) {
      setError(
        "O responsável é obrigatório.",
      );

      return false;
    }

    if (!obligation.dueDate) {
      setError(
        "O vencimento é obrigatório.",
      );

      return false;
    }

    if (
      obligation.source === "mock"
    ) {
      setError(
        "Este é um dado demonstrativo. Para testar edição e conclusão, utilize uma obrigação cadastrada pelo BravHAS.",
      );

      return false;
    }

    return true;
  }

  function persistObligation(
    nextStatus?: ObligationStatus,
  ): boolean {
    if (!obligation) {
      return false;
    }

    if (!validate()) {
      return false;
    }

    const status =
      nextStatus ??
      obligation.status;

    const now =
      new Date().toISOString();

    const stored =
      getStoredObligations();

    const updated =
      stored.map((item) => {
        if (
          item.id !== obligation.id
        ) {
          return item;
        }

        return {
          ...item,

          title:
            obligation.title.trim(),

          description:
            obligation.description,

          area:
            obligation.area,

          priority:
            obligation.priority,

          status,

          responsibleName:
            obligation.responsibleName.trim(),

          dueDate: new Date(
            `${obligation.dueDate}T12:00:00`,
          ).toISOString(),

          completedAt:
            status === "COMPLETED"
              ? now
              : null,

          notes:
            obligation.notes,

          updatedAt: now,
        };
      });

    saveStoredObligations(
      updated,
    );

    setObligation({
      ...obligation,

      status,

      completedAt:
        status === "COMPLETED"
          ? now
          : null,

      updatedAt: now,
    });

    setError(null);

    return true;
  }

  function handleSave() {
    const success =
      persistObligation();

    if (!success) {
      return;
    }

    setSaved(true);
  }

  function handleComplete() {
    const success =
      persistObligation(
        "COMPLETED",
      );

    if (!success) {
      return;
    }

    router.push(
      "/obrigacoes",
    );
  }

  function handleCancel() {
    const success =
      persistObligation(
        "CANCELED",
      );

    if (!success) {
      return;
    }

    router.push(
      "/obrigacoes",
    );
  }

  if (!obligation) {
    return (
      <PermissionGuard
        resource="OBLIGATIONS"
        action="VIEW"
      >
        <AppShell
        sidebar={<Sidebar />}
        header={<Header />}
      >
        <div className="flex h-full items-center justify-center p-5">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold text-[#0B2947]">
              {error ??
                "Carregando obrigação..."}
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/obrigacoes",
                )
              }
              className="mt-4 rounded-xl bg-[#154B7A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103D65]"
            >
              Voltar
            </button>
          </div>
        </div>
        </AppShell>
      </PermissionGuard>
    );
  }

  const readOnly =
    obligation.source === "mock";

  return (
    <PermissionGuard
      resource="OBLIGATIONS"
      action="VIEW"
    >
      <AppShell
      sidebar={<Sidebar />}
      header={<Header />}
    >
      <div className="grid h-full grid-rows-[auto_1fr] gap-4 overflow-hidden p-5">
        {/* CABEÇALHO */}
        <section className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Obrigação administrativa
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">
              {obligation.title}
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              {
                areaLabels[
                  obligation.area
                ]
              }{" "}
              • {statusLabel} •{" "}
              {priorityLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/obrigacoes",
              )
            }
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
          >
            Voltar
          </button>
        </section>

        {/* CONTEÚDO */}
        <section className="grid min-h-0 grid-cols-[1.35fr_0.65fr] gap-4">
          {/* FORMULÁRIO */}
          <div className="min-h-0 overflow-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              {/* TÍTULO */}
              <div className="col-span-2">
                <label
                  htmlFor="title"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Título
                </label>

                <input
                  id="title"
                  value={
                    obligation.title
                  }
                  disabled={readOnly}
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                />
              </div>

              {/* ÁREA */}
              <div>
                <label
                  htmlFor="area"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Área
                </label>

                <select
                  id="area"
                  value={
                    obligation.area
                  }
                  disabled={readOnly}
                  onChange={(event) =>
                    updateField(
                      "area",
                      event.target
                        .value as ObligationArea,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
                >
                  <option value="FINANCIAL">
                    Financeiro
                  </option>

                  <option value="HR">
                    Recursos Humanos
                  </option>

                  <option value="PAYROLL">
                    Departamento Pessoal
                  </option>

                  <option value="COMPLIANCE">
                    Compliance
                  </option>

                  <option value="ADMINISTRATIVE">
                    Administrativo
                  </option>
                </select>
              </div>

              {/* PRIORIDADE */}
              <div>
                <label
                  htmlFor="priority"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Prioridade
                </label>

                <select
                  id="priority"
                  value={
                    obligation.priority
                  }
                  disabled={readOnly}
                  onChange={(event) =>
                    updateField(
                      "priority",
                      event.target
                        .value as ObligationPriority,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
                >
                  <option value="LOW">
                    Baixa
                  </option>

                  <option value="MEDIUM">
                    Média
                  </option>

                  <option value="HIGH">
                    Alta
                  </option>

                  <option value="CRITICAL">
                    Crítica
                  </option>
                </select>
              </div>

              {/* RESPONSÁVEL */}
              <div>
                <label
                  htmlFor="responsible"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Responsável
                </label>

                <input
                  id="responsible"
                  value={
                    obligation.responsibleName
                  }
                  disabled={readOnly}
                  onChange={(event) =>
                    updateField(
                      "responsibleName",
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] focus:border-[#154B7A]"
                />
              </div>

              {/* VENCIMENTO */}
              <div>
                <label
                  htmlFor="dueDate"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Vencimento
                </label>

                <input
                  id="dueDate"
                  type="date"
                  value={
                    obligation.dueDate
                  }
                  disabled={readOnly}
                  onChange={(event) =>
                    updateField(
                      "dueDate",
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] focus:border-[#154B7A]"
                />
              </div>

              {/* STATUS */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={
                    obligation.status
                  }
                  disabled={readOnly}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target
                        .value as ObligationStatus,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
                >
                  <option value="PENDING">
                    Pendente
                  </option>

                  <option value="IN_PROGRESS">
                    Em andamento
                  </option>

                  <option value="COMPLETED">
                    Concluída
                  </option>

                  <option value="CANCELED">
                    Cancelada
                  </option>
                </select>
              </div>

              {/* DESCRIÇÃO */}
              <div className="col-span-2">
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Descrição
                </label>

                <textarea
                  id="description"
                  rows={3}
                  value={
                    obligation.description ??
                    ""
                  }
                  disabled={readOnly}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] focus:border-[#154B7A]"
                />
              </div>

              {/* OBSERVAÇÕES */}
              <div className="col-span-2">
                <label
                  htmlFor="notes"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Observações
                </label>

                <textarea
                  id="notes"
                  rows={2}
                  value={
                    obligation.notes ??
                    ""
                  }
                  disabled={readOnly}
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value,
                    )
                  }
                  className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] focus:border-[#154B7A]"
                />
              </div>
            </div>
          </div>

          {/* PAINEL DIREITO */}
          <div className="grid min-h-0 grid-rows-[auto_auto_1fr_auto] gap-4">
            <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Controle da obrigação
              </p>

              <h3 className="mt-2 text-lg font-bold">
                {statusLabel}
              </h3>

              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/60">
                  Área
                </p>

                <p className="text-sm font-semibold">
                  {
                    areaLabels[
                      obligation.area
                    ]
                  }
                </p>

                <p className="pt-2 text-xs text-white/60">
                  Responsável
                </p>

                <p className="text-sm font-semibold">
                  {
                    obligation.responsibleName
                  }
                </p>

                <p className="pt-2 text-xs text-white/60">
                  Prioridade
                </p>

                <p className="text-sm font-semibold">
                  {priorityLabel}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-[#64748B]">
                Origem
              </p>

              <p className="mt-1 text-sm font-bold text-[#0B2947]">
                {readOnly
                  ? "Dado demonstrativo"
                  : "Obrigação cadastrada"}
              </p>

              <p className="mt-2 text-[11px] leading-5 text-[#94A3B8]">
                {readOnly
                  ? "Dados demonstrativos são somente leitura nesta versão."
                  : "Esta obrigação pode ser editada, concluída ou cancelada."}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              {saved && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-semibold text-[#16A34A]">
                    Alterações salvas com sucesso.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold leading-5 text-[#DC2626]">
                    {error}
                  </p>
                </div>
              )}

              {!saved &&
                !error && (
                  <p className="text-xs leading-5 text-[#94A3B8]">
                    Atualize os dados da obrigação e salve as alterações para manter o controle administrativo atualizado.
                  </p>
                )}
            </div>

            {/* AÇÕES */}
            {!readOnly ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  className="h-10 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#64748B] transition hover:bg-[#F8FAFC]"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    handleComplete
                  }
                  className="h-10 rounded-xl border border-green-200 bg-green-50 text-xs font-semibold text-[#16A34A] transition hover:bg-green-100"
                >
                  Concluir
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="h-10 rounded-xl bg-[#154B7A] text-xs font-semibold text-white transition hover:bg-[#103D65]"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/obrigacoes",
                  )
                }
                className="h-10 w-full rounded-xl bg-[#154B7A] text-sm font-semibold text-white transition hover:bg-[#103D65]"
              >
                Voltar à Central
              </button>
            )}
          </div>
        </section>
      </div>
      </AppShell>
    </PermissionGuard>
  );
}