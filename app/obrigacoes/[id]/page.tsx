"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";
import type { ObligationArea, ObligationPriority, ObligationStatus } from "@/modules/obligations/domain/entities/Obligation";

interface EditableObligation {
  id: string;
  title: string;
  description: string | null;
  area: ObligationArea;
  priority: ObligationPriority;
  status: ObligationStatus;
  responsibleName: string;
  dueDate: string;
  completedAt: string | null;
  recurrence: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const areaLabels: Record<ObligationArea, string> = {
  FINANCIAL: "Financeiro",
  HR: "Recursos Humanos",
  PAYROLL: "Departamento Pessoal",
  COMPLIANCE: "Compliance",
  ADMINISTRATIVE: "Administrativo",
};

const priorityLabels: Record<ObligationPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const statusLabels: Record<ObligationStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  OVERDUE: "Atrasada",
  CANCELED: "Cancelada",
};

export default function ObligationDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [obligation, setObligation] = useState<EditableObligation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadObligation() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/obrigacoes/${params.id}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success || !data.obligation) {
          throw new Error(data?.message ?? "Obrigação não encontrada.");
        }
        if (!cancelled) {
          const item = data.obligation;
          setObligation({
            ...item,
            dueDate: new Date(item.dueDate).toISOString().slice(0, 10),
            completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : null,
            createdAt: new Date(item.createdAt).toISOString(),
            updatedAt: new Date(item.updatedAt).toISOString(),
          });
        }
      } catch (caughtError) {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Obrigação não encontrada.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadObligation();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const statusLabel = useMemo(() => obligation ? statusLabels[obligation.status] : "", [obligation]);
  const priorityLabel = useMemo(() => obligation ? priorityLabels[obligation.priority] : "", [obligation]);

  function updateField<K extends keyof EditableObligation>(field: K, value: EditableObligation[K]) {
    if (!obligation) return;
    setObligation({ ...obligation, [field]: value });
    setSaved(false);
    setError(null);
  }

  async function persistObligation(nextStatus?: ObligationStatus): Promise<boolean> {
    if (!obligation) return false;
    if (!obligation.title.trim()) {
      setError("O título da obrigação é obrigatório.");
      return false;
    }
    if (!obligation.responsibleName.trim()) {
      setError("O responsável é obrigatório.");
      return false;
    }
    if (!obligation.dueDate) {
      setError("O vencimento é obrigatório.");
      return false;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/obrigacoes/${obligation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: obligation.title,
          description: obligation.description ?? "",
          area: obligation.area,
          priority: obligation.priority,
          status: nextStatus ?? obligation.status,
          responsibleName: obligation.responsibleName,
          dueDate: `${obligation.dueDate}T12:00:00`,
          recurrence: obligation.recurrence,
          notes: obligation.notes ?? "",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.obligation) {
        throw new Error(data?.message ?? "Não foi possível atualizar a obrigação.");
      }
      const item = data.obligation;
      setObligation({
        ...item,
        dueDate: new Date(item.dueDate).toISOString().slice(0, 10),
        completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : null,
        createdAt: new Date(item.createdAt).toISOString(),
        updatedAt: new Date(item.updatedAt).toISOString(),
      });
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível atualizar a obrigação.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (await persistObligation()) setSaved(true);
  }

  async function handleComplete() {
    if (await persistObligation("COMPLETED")) router.push("/obrigacoes");
  }

  async function handleCancel() {
    if (await persistObligation("CANCELED")) router.push("/obrigacoes");
  }

  if (loading || !obligation) {
    return (
      <PermissionGuard resource="OBLIGATIONS" action="VIEW">
        <AppShell sidebar={<Sidebar />} header={<Header />}>
          <div className="flex h-full items-center justify-center p-5">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-bold text-[#0B2947]">{loading ? "Carregando obrigação..." : error ?? "Obrigação não encontrada."}</h2>
              {!loading && <button type="button" onClick={() => router.push("/obrigacoes")} className="mt-4 rounded-xl bg-[#154B7A] px-4 py-2.5 text-sm font-semibold text-white">Voltar</button>}
            </div>
          </div>
        </AppShell>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard resource="OBLIGATIONS" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <div className="grid h-full grid-rows-[auto_1fr] gap-4 overflow-hidden p-5">
          <section className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Obrigação administrativa</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">{obligation.title}</h2>
              <p className="mt-1 text-sm text-[#64748B]">{areaLabels[obligation.area]} • {statusLabel} • {priorityLabel}</p>
            </div>
            <button type="button" onClick={() => router.push("/obrigacoes")} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569]">Voltar</button>
          </section>

          <section className="grid min-h-0 grid-cols-[1.35fr_0.65fr] gap-4">
            <div className="min-h-0 overflow-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Título</label><input value={obligation.title} onChange={(e) => updateField("title", e.target.value)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Área</label><select value={obligation.area} onChange={(e) => updateField("area", e.target.value as ObligationArea)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm"><option value="FINANCIAL">Financeiro</option><option value="HR">RH</option><option value="PAYROLL">DP</option><option value="COMPLIANCE">Compliance</option><option value="ADMINISTRATIVE">Administrativo</option></select></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Prioridade</label><select value={obligation.priority} onChange={(e) => updateField("priority", e.target.value as ObligationPriority)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm"><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Responsável</label><input value={obligation.responsibleName} onChange={(e) => updateField("responsibleName", e.target.value)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Vencimento</label><input type="date" value={obligation.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Status</label><select value={obligation.status} onChange={(e) => updateField("status", e.target.value as ObligationStatus)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm"><option value="PENDING">Pendente</option><option value="IN_PROGRESS">Em andamento</option><option value="OVERDUE">Atrasada</option><option value="COMPLETED">Concluída</option><option value="CANCELED">Cancelada</option></select></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Recorrência</label><select value={obligation.recurrence} onChange={(e) => updateField("recurrence", e.target.value)} className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm"><option value="NONE">Não recorrente</option><option value="DAILY">Diária</option><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensal</option><option value="YEARLY">Anual</option></select></div>
                <div className="col-span-2"><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Descrição</label><textarea rows={3} value={obligation.description ?? ""} onChange={(e) => updateField("description", e.target.value)} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm" /></div>
                <div className="col-span-2"><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Observações</label><textarea rows={2} value={obligation.notes ?? ""} onChange={(e) => updateField("notes", e.target.value)} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm" /></div>
                {error && <div className="col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-[#DC2626]">{error}</div>}
                {saved && <div className="col-span-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700">Alterações salvas.</div>}
              </div>
            </div>
            <div className="grid min-h-0 grid-rows-[1fr_auto] gap-4">
              <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Controle</p><h3 className="mt-2 text-lg font-bold">Persistência real</h3><p className="mt-3 text-sm leading-6 text-white/70">As alterações deste registro são gravadas no banco e auditadas pela autoria da sessão.</p></div>
              <div className="grid grid-cols-3 gap-2"><button disabled={saving} type="button" onClick={handleCancel} className="h-10 rounded-xl border border-red-200 bg-white text-xs font-semibold text-[#DC2626]">Cancelar obrigação</button><button disabled={saving} type="button" onClick={handleComplete} className="h-10 rounded-xl border border-green-200 bg-white text-xs font-semibold text-green-700">Concluir</button><button disabled={saving} type="button" onClick={handleSave} className="h-10 rounded-xl bg-[#154B7A] text-xs font-semibold text-white">{saving ? "Salvando..." : "Salvar"}</button></div>
            </div>
          </section>
        </div>
      </AppShell>
    </PermissionGuard>
  );
}
