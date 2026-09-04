"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CalendarDays, CheckCircle2, CircleAlert, Clock3, History } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { OperationalModulePage } from "@/components/layout/OperationalModulePage";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";

type ObligationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELED";

type ObligationItem = {
  id: string;
  title: string;
  description: string | null;
  area: "FINANCIAL" | "HR" | "PAYROLL" | "COMPLIANCE" | "ADMINISTRATIVE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: ObligationStatus;
  responsibleName: string;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const areaLabels: Record<ObligationItem["area"], string> = {
  FINANCIAL: "Financeiro",
  HR: "RH",
  PAYROLL: "DP",
  COMPLIANCE: "Compliance",
  ADMINISTRATIVE: "Administrativo",
};

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AgendaPage() {
  const [obligations, setObligations] = useState<ObligationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/obrigacoes", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.obligations)) {
          throw new Error(data?.message ?? "Não foi possível carregar a agenda.");
        }
        if (!cancelled) setObligations(data.obligations as ObligationItem[]);
      } catch (caught) {
        if (!cancelled) {
          setObligations([]);
          setError(caught instanceof Error ? caught.message : "Não foi possível carregar a agenda.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const agenda = useMemo(() => {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const weekEnd = endOfDay(new Date(todayStart.getTime() + 6 * 24 * 60 * 60 * 1000));
    const monthEnd = endOfDay(new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000));

    const active = obligations.filter((item) => item.status !== "COMPLETED" && item.status !== "CANCELED");
    const completed = obligations
      .filter((item) => item.status === "COMPLETED" && item.completedAt)
      .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());

    const byDueDate = [...active].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const today = active.filter((item) => {
      const due = new Date(item.dueDate);
      return due >= todayStart && due <= todayEnd;
    });
    const week = active.filter((item) => {
      const due = new Date(item.dueDate);
      return due >= todayStart && due <= weekEnd;
    });
    const next30 = active.filter((item) => {
      const due = new Date(item.dueDate);
      return due >= todayStart && due <= monthEnd;
    });
    const overdue = active.filter((item) => new Date(item.dueDate) < todayStart);

    return { active, completed, byDueDate, today, week, next30, overdue };
  }, [obligations]);

  const metrics = [
    { label: "Hoje", value: agenda.today.length, icon: CalendarDays },
    { label: "Esta semana", value: agenda.week.length, icon: CalendarCheck2 },
    { label: "Próximos 30 dias", value: agenda.next30.length, icon: Clock3 },
    { label: "Atrasados", value: agenda.overdue.length, icon: CircleAlert },
  ];

  return (
    <PermissionGuard resource="AGENDA" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <OperationalModulePage
          eyebrow="Operação"
          title="Agenda"
          description="Compromissos, vencimentos e histórico das obrigações administrativas do BravHAS."
          statusText="Agenda integrada às Obrigações"
        >
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-[#64748B]">{label}</p>
                  <Icon size={17} className="text-[#154B7A]" aria-hidden="true" />
                </div>
                <p className="mt-2 text-2xl font-bold text-[#0B2947]">{loading ? "…" : value}</p>
              </div>
            ))}
          </section>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

          <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
            <article className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0B2947]">Próximos compromissos</h3>
                  <p className="mt-1 text-xs text-[#94A3B8]">Obrigações em aberto ordenadas por vencimento.</p>
                </div>
                <Link href="/obrigacoes/nova" className="rounded-xl bg-[#154B7A] px-3 py-2 text-xs font-semibold text-white">+ Nova obrigação</Link>
              </div>

              {loading ? (
                <div className="p-6 text-sm text-[#64748B]">Carregando agenda...</div>
              ) : agenda.byDueDate.length === 0 ? (
                <div className="p-10 text-center">
                  <CalendarDays className="mx-auto text-[#94A3B8]" size={30} aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-[#475569]">Nenhuma obrigação em aberto.</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">Crie uma obrigação para alimentar a agenda.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {agenda.byDueDate.slice(0, 20).map((item) => {
                    const overdue = new Date(item.dueDate) < startOfDay();
                    return (
                      <Link key={item.id} href={`/obrigacoes/${item.id}`} className="grid gap-2 px-5 py-4 transition hover:bg-[#F8FAFC] md:grid-cols-[1fr_150px_120px] md:items-center">
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">{item.title}</p>
                          <p className="mt-1 text-xs text-[#64748B]">{areaLabels[item.area]} · {item.responsibleName}</p>
                        </div>
                        <div className={`text-xs font-semibold ${overdue ? "text-red-600" : "text-[#475569]"}`}>{overdue ? "Atrasada · " : ""}{formatDate(item.dueDate)}</div>
                        <div className="text-xs font-semibold text-[#154B7A]">{item.status === "IN_PROGRESS" ? "Em andamento" : item.status === "OVERDUE" ? "Atrasada" : "Pendente"}</div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#E2E8F0] px-5 py-4">
                <History className="h-5 w-5 text-[#154B7A]" />
                <div>
                  <h3 className="text-sm font-bold text-[#0B2947]">Histórico de concluídas</h3>
                  <p className="mt-1 text-xs text-[#94A3B8]">Tarefas concluídas permanecem rastreáveis.</p>
                </div>
              </div>

              {loading ? (
                <div className="p-6 text-sm text-[#64748B]">Carregando histórico...</div>
              ) : agenda.completed.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="mx-auto text-[#94A3B8]" size={28} aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-[#475569]">Nenhuma tarefa concluída ainda.</p>
                </div>
              ) : (
                <div className="max-h-[32rem] divide-y divide-[#F1F5F9] overflow-auto">
                  {agenda.completed.slice(0, 30).map((item) => (
                    <Link key={item.id} href={`/obrigacoes/${item.id}`} className="block px-5 py-4 transition hover:bg-[#F8FAFC]">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#0F172A]">{item.title}</p>
                          <p className="mt-1 text-xs text-[#64748B]">{areaLabels[item.area]} · {item.responsibleName}</p>
                          <p className="mt-1 text-[11px] text-[#94A3B8]">Concluída em {formatDateTime(item.completedAt!)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </article>
          </section>
        </OperationalModulePage>
      </AppShell>
    </PermissionGuard>
  );
}
