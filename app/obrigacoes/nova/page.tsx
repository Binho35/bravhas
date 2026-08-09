"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  addStoredObligation,
  type StoredObligation,
} from "@/modules/obligations/storage/obligationStorage";
import type {
  ObligationArea,
  ObligationPriority,
  ObligationStatus,
} from "@/modules/obligations/domain/entities/Obligation";

interface FormState {
  title: string;
  area: ObligationArea | "";
  priority: ObligationPriority;
  responsibleName: string;
  dueDate: string;
  status: ObligationStatus;
  recurrence: string;
  description: string;
  notes: string;
}

const initialState: FormState = {
  title: "",
  area: "",
  priority: "MEDIUM",
  responsibleName: "",
  dueDate: "",
  status: "PENDING",
  recurrence: "NONE",
  description: "",
  notes: "",
};

export default function NewObligationPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>(initialState);

  const [error, setError] =
    useState<string | null>(null);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError(null);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError(
        "Informe o título da obrigação.",
      );
      return;
    }

    if (!form.area) {
      setError(
        "Selecione a área responsável.",
      );
      return;
    }

    if (!form.responsibleName.trim()) {
      setError(
        "Informe o responsável.",
      );
      return;
    }

    if (!form.dueDate) {
      setError(
        "Informe a data de vencimento.",
      );
      return;
    }

    const now = new Date();

    const obligation: StoredObligation = {
      id: `OBG-${Date.now()}`,

      title: form.title.trim(),

      description:
        form.description.trim() ||
        undefined,

      area: form.area,

      priority: form.priority,

      status: form.status,

      responsibleId: "LOCAL-USER",

      responsibleName:
        form.responsibleName.trim(),

      dueDate: new Date(
        `${form.dueDate}T12:00:00`,
      ).toISOString(),

      completedAt: null,

      notes:
        form.notes.trim() || null,

      createdAt: now.toISOString(),

      updatedAt: now.toISOString(),
    };

    addStoredObligation(obligation);

    router.push("/obrigacoes");
  }

  return (
    <AppShell
      sidebar={<Sidebar />}
      header={<Header />}
    >
      <form
        onSubmit={handleSubmit}
        className="grid h-full grid-rows-[auto_1fr] gap-4 overflow-hidden p-5"
      >
        {/* CABEÇALHO */}
        <section className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Gestão Administrativa
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">
              Nova obrigação
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Cadastre uma responsabilidade administrativa para
              acompanhamento.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/obrigacoes")
            }
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
          >
            Voltar
          </button>
        </section>

        {/* FORMULÁRIO */}
        <section className="grid min-h-0 grid-cols-[1.35fr_0.65fr] gap-4">
          {/* COLUNA PRINCIPAL */}
          <div className="min-h-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="border-b border-[#E2E8F0] px-5 py-4">
              <h3 className="text-sm font-bold text-[#0B2947]">
                Informações da obrigação
              </h3>

              <p className="mt-1 text-[11px] text-[#94A3B8]">
                Defina o que precisa ser acompanhado, por quem e até quando.
              </p>
            </div>

            <div className="grid h-full min-h-0 grid-cols-2 gap-x-4 gap-y-4 overflow-auto p-5">
              {/* TÍTULO */}
              <div className="col-span-2">
                <label
                  htmlFor="title"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Título da obrigação
                </label>

                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Conferir recebimentos previstos"
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#CBD5E1] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
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
                  value={form.area}
                  onChange={(event) =>
                    updateField(
                      "area",
                      event.target
                        .value as ObligationArea,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                >
                  <option value="" disabled>
                    Selecione
                  </option>

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
                  value={form.priority}
                  onChange={(event) =>
                    updateField(
                      "priority",
                      event.target
                        .value as ObligationPriority,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
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
                  type="text"
                  value={form.responsibleName}
                  onChange={(event) =>
                    updateField(
                      "responsibleName",
                      event.target.value,
                    )
                  }
                  placeholder="Nome do responsável"
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition placeholder:text-[#CBD5E1] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
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
                  value={form.dueDate}
                  onChange={(event) =>
                    updateField(
                      "dueDate",
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                />
              </div>

              {/* STATUS */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Status inicial
                </label>

                <select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target
                        .value as ObligationStatus,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                >
                  <option value="PENDING">
                    Pendente
                  </option>

                  <option value="IN_PROGRESS">
                    Em andamento
                  </option>
                </select>
              </div>

              {/* RECORRÊNCIA */}
              <div>
                <label
                  htmlFor="recurrence"
                  className="mb-1.5 block text-xs font-semibold text-[#334155]"
                >
                  Recorrência
                </label>

                <select
                  id="recurrence"
                  value={form.recurrence}
                  onChange={(event) =>
                    updateField(
                      "recurrence",
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                >
                  <option value="NONE">
                    Não recorrente
                  </option>

                  <option value="DAILY">
                    Diária
                  </option>

                  <option value="WEEKLY">
                    Semanal
                  </option>

                  <option value="MONTHLY">
                    Mensal
                  </option>

                  <option value="YEARLY">
                    Anual
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
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Descreva o que precisa ser conferido, executado ou acompanhado."
                  className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none transition placeholder:text-[#CBD5E1] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
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
                  value={form.notes}
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value,
                    )
                  }
                  placeholder="Informações adicionais, dependências ou orientações."
                  className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none transition placeholder:text-[#CBD5E1] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                />
              </div>
            </div>
          </div>

          {/* COLUNA LATERAL */}
          <div className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4">
            <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Regra BravHAS
              </p>

              <h3 className="mt-2 text-lg font-bold">
                Controle completo
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/70">
                Toda obrigação deve possuir responsável,
                prazo, prioridade e acompanhamento.
              </p>
            </div>

            <div className="min-h-0 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#0B2947]">
                Antes de salvar
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  "A obrigação está claramente descrita?",
                  "Existe um responsável definido?",
                  "O prazo está correto?",
                  "A prioridade representa o risco?",
                  "Há informação suficiente para acompanhamento?",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#154B7A]" />

                    <p className="text-xs leading-5 text-[#64748B]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-[#DC2626]">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push("/obrigacoes")
                }
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="h-10 flex-1 rounded-xl bg-[#154B7A] text-sm font-semibold text-white transition hover:bg-[#103D65]"
              >
                Salvar obrigação
              </button>
            </div>
          </div>
        </section>
      </form>
    </AppShell>
  );
}