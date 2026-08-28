"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";
import type { ObligationArea, ObligationPriority, ObligationStatus } from "@/modules/obligations/domain/entities/Obligation";

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
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return setError("Informe o título da obrigação.");
    if (!form.area) return setError("Selecione a área responsável.");
    if (!form.responsibleName.trim()) return setError("Informe o responsável.");
    if (!form.dueDate) return setError("Informe a data de vencimento.");

    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/obrigacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          area: form.area,
          priority: form.priority,
          status: form.status,
          recurrence: form.recurrence,
          responsibleName: form.responsibleName,
          dueDate: `${form.dueDate}T12:00:00`,
          notes: form.notes,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data?.message ?? "Não foi possível salvar a obrigação.");
      router.push("/obrigacoes");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível salvar a obrigação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGuard resource="OBLIGATIONS" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <form onSubmit={handleSubmit} className="grid h-full grid-rows-[auto_1fr] gap-4 overflow-hidden p-5">
          <section className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Gestão Administrativa</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">Nova obrigação</h2>
              <p className="mt-1 text-sm text-[#64748B]">Cadastre uma responsabilidade administrativa para acompanhamento.</p>
            </div>
            <button type="button" onClick={() => router.push("/obrigacoes")} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569]">Voltar</button>
          </section>

          <section className="grid min-h-0 grid-cols-[1.35fr_0.65fr] gap-4">
            <div className="min-h-0 overflow-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Título</label><input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Área</label><select value={form.area} onChange={(e) => updateField("area", e.target.value as ObligationArea)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm"><option value="" disabled>Selecione</option><option value="FINANCIAL">Financeiro</option><option value="HR">RH</option><option value="PAYROLL">DP</option><option value="COMPLIANCE">Compliance</option><option value="ADMINISTRATIVE">Administrativo</option></select></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Prioridade</label><select value={form.priority} onChange={(e) => updateField("priority", e.target.value as ObligationPriority)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm"><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Responsável</label><input value={form.responsibleName} onChange={(e) => updateField("responsibleName", e.target.value)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Vencimento</label><input type="date" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Status inicial</label><select value={form.status} onChange={(e) => updateField("status", e.target.value as ObligationStatus)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm"><option value="PENDING">Pendente</option><option value="IN_PROGRESS">Em andamento</option></select></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Recorrência</label><select value={form.recurrence} onChange={(e) => updateField("recurrence", e.target.value)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm"><option value="NONE">Não recorrente</option><option value="DAILY">Diária</option><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensal</option><option value="YEARLY">Anual</option></select></div>
                <div className="col-span-2"><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Descrição</label><textarea rows={3} value={form.description} onChange={(e) => updateField("description", e.target.value)} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm" /></div>
                <div className="col-span-2"><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Observações</label><textarea rows={2} value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm" /></div>
                {error && <div className="col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-[#DC2626]">{error}</div>}
              </div>
            </div>
            <div className="grid min-h-0 grid-rows-[1fr_auto] gap-4">
              <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Regra BravHAS</p><h3 className="mt-2 text-lg font-bold">Controle completo</h3><p className="mt-3 text-sm leading-6 text-white/70">Toda obrigação deve possuir responsável, prazo, prioridade e acompanhamento persistente.</p></div>
              <div className="flex gap-3"><button type="button" onClick={() => router.push("/obrigacoes")} className="h-10 flex-1 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569]">Cancelar</button><button disabled={saving} type="submit" className="h-10 flex-1 rounded-xl bg-[#154B7A] text-sm font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar obrigação"}</button></div>
            </div>
          </section>
        </form>
      </AppShell>
    </PermissionGuard>
  );
}
