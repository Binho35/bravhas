"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";
import type { FinancialAccountStatus, FinancialAccountType } from "@/modules/financial/domain/entities/FinancialAccount";

interface FinancialAccountListItem {
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

interface FinancialAccountApiItem extends Omit<FinancialAccountListItem, "issueDate" | "dueDate" | "paymentDate" | "amount" | "paidAmount" | "discount" | "interest" | "fine" | "createdAt" | "updatedAt"> {
  issueDate: string;
  dueDate: string;
  paymentDate?: string | null;
  amount: number | string;
  paidAmount: number | string;
  discount: number | string;
  interest: number | string;
  fine: number | string;
  createdAt: string;
  updatedAt: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function convertApiFinancialAccount(item: FinancialAccountApiItem): FinancialAccountListItem {
  return {
    ...item,
    paymentDate: item.paymentDate ? new Date(item.paymentDate) : null,
    issueDate: new Date(item.issueDate),
    dueDate: new Date(item.dueDate),
    amount: Number(item.amount),
    paidAmount: Number(item.paidAmount),
    discount: Number(item.discount),
    interest: Number(item.interest),
    fine: Number(item.fine),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

function isAccountOverdue(account: FinancialAccountListItem, referenceDate: Date): boolean {
  if (account.status === "PAID" || account.status === "CANCELED") return false;
  if (account.status === "OVERDUE") return true;
  return account.dueDate.getTime() < referenceDate.getTime();
}

function getStatusLabel(account: FinancialAccountListItem, today: Date): string {
  if (account.status === "PAID") return "Pago";
  if (isAccountOverdue(account, today)) return "Vencido";
  if (account.status === "PARTIALLY_PAID") return "Parcial";
  if (account.status === "CANCELED") return "Cancelado";
  return "Em aberto";
}

function getStatusClass(account: FinancialAccountListItem, today: Date): string {
  if (account.status === "PAID") return "bg-green-50 text-green-700";
  if (isAccountOverdue(account, today)) return "bg-red-50 text-red-700";
  if (account.status === "PARTIALLY_PAID") return "bg-amber-50 text-amber-700";
  if (account.status === "CANCELED") return "bg-slate-100 text-slate-500";
  return "bg-blue-50 text-blue-700";
}

export default function FinanceiroPage() {
  const router = useRouter();
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFinancialAccounts() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/financeiro/contas", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message ?? "Não foi possível carregar as contas financeiras.");
        }
        if (!cancelled) {
          setFinancialAccounts(
            Array.isArray(data?.accounts)
              ? data.accounts.map((item: FinancialAccountApiItem) => convertApiFinancialAccount(item))
              : [],
          );
        }
      } catch (caughtError) {
        if (!cancelled) {
          setFinancialAccounts([]);
          setError(caughtError instanceof Error ? caughtError.message : "Não foi possível carregar as contas financeiras.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFinancialAccounts();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(() => new Date(), []);
  const payableOpen = useMemo(
    () => financialAccounts.filter((item) => item.type === "PAYABLE" && item.status !== "PAID" && item.status !== "CANCELED"),
    [financialAccounts],
  );
  const receivableOpen = useMemo(
    () => financialAccounts.filter((item) => item.type === "RECEIVABLE" && item.status !== "PAID" && item.status !== "CANCELED"),
    [financialAccounts],
  );
  const paidAccounts = useMemo(() => financialAccounts.filter((item) => item.status === "PAID"), [financialAccounts]);

  const totalPayable = payableOpen.reduce((total, item) => total + item.amount, 0);
  const totalReceivable = receivableOpen.reduce((total, item) => total + item.amount, 0);
  const totalPaid = paidAccounts.reduce((total, item) => total + item.paidAmount, 0);
  const projectedBalance = totalReceivable - totalPayable;
  const overdueAccounts = financialAccounts.filter((item) => isAccountOverdue(item, today));
  const upcomingAccounts = [...financialAccounts]
    .filter((item) => item.status !== "PAID" && item.status !== "CANCELED")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 6);

  const dayFiveReceivables = receivableOpen.filter((item) => item.dueDate.getDate() === 5);
  const dayTwentyReceivables = receivableOpen.filter((item) => item.dueDate.getDate() === 20);
  const dayFiveTotal = dayFiveReceivables.reduce((total, item) => total + item.amount, 0);
  const dayTwentyTotal = dayTwentyReceivables.reduce((total, item) => total + item.amount, 0);
  const sortedAccounts = useMemo(() => [...financialAccounts].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()), [financialAccounts]);

  return (
    <PermissionGuard resource="FINANCIAL" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <div className="h-full overflow-auto p-3 sm:p-5">
          <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-4">
            <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Gestão Administrativa</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">Financeiro</h2>
                <p className="mt-1 text-sm text-[#64748B]">Caixa, recebimentos, pagamentos e vencimentos sob acompanhamento.</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 shadow-sm sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">Posição projetada</p>
                  <p className={`mt-1 break-words text-sm font-bold ${projectedBalance >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{formatCurrency(projectedBalance)}</p>
                </div>
                <Link href="/financeiro/fluxo-caixa" className="flex min-h-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#154B7A] shadow-sm transition hover:border-[#154B7A] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154B7A]/30">Fluxo de Caixa</Link>
                <Link href="/financeiro/nova" className="flex min-h-11 items-center justify-center rounded-xl bg-[#154B7A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#103D65] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154B7A]/30">+ Nova conta</Link>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Indicadores financeiros">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm"><p className="text-xs font-medium text-[#64748B]">Contas a pagar</p><p className="mt-2 break-words text-lg font-bold text-[#DC2626] sm:text-xl">{formatCurrency(totalPayable)}</p><p className="mt-1 text-[10px] text-[#94A3B8]">{payableOpen.length} em aberto</p></div>
              <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm"><p className="text-xs font-medium text-[#64748B]">Contas a receber</p><p className="mt-2 break-words text-lg font-bold text-[#16A34A] sm:text-xl">{formatCurrency(totalReceivable)}</p><p className="mt-1 text-[10px] text-[#94A3B8]">{receivableOpen.length} em aberto</p></div>
              <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm"><p className="text-xs font-medium text-[#64748B]">Saldo projetado</p><p className={`mt-2 break-words text-lg font-bold sm:text-xl ${projectedBalance >= 0 ? "text-[#154B7A]" : "text-[#DC2626]"}`}>{formatCurrency(projectedBalance)}</p><p className="mt-1 text-[10px] text-[#94A3B8]">Receber menos pagar</p></div>
              <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-medium text-[#64748B]">Vencidas</p><p className="mt-2 text-xl font-bold text-[#DC2626]">{overdueAccounts.length}</p><p className="mt-1 text-[10px] text-[#94A3B8]">Exigem ação imediata</p></div>
              <div className="col-span-2 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm md:col-span-1"><p className="text-xs font-medium text-[#64748B]">Pagamentos realizados</p><p className="mt-2 break-words text-lg font-bold text-[#154B7A] sm:text-xl">{formatCurrency(totalPaid)}</p><p className="mt-1 text-[10px] text-[#94A3B8]">No período atual</p></div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="grid min-w-0 gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: "Dia 5", total: dayFiveTotal, count: dayFiveReceivables.length },
                    { label: "Dia 20", total: dayTwentyTotal, count: dayTwentyReceivables.length },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">Recebimentos previstos</p>
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                        <div><p className="text-sm font-bold text-[#0B2947]">{item.label}</p><p className="mt-1 break-words text-2xl font-bold text-[#16A34A]">{formatCurrency(item.total)}</p></div>
                        <span className="rounded-full bg-[#EAF3FB] px-2.5 py-1 text-[10px] font-bold text-[#154B7A]">{item.count} previstos</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="min-w-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3">
                    <div><h3 className="text-sm font-bold text-[#0B2947]">Movimentações financeiras</h3><p className="mt-0.5 text-[11px] text-[#94A3B8]">Contas a pagar e receber no período.</p></div>
                    <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-semibold text-[#64748B]">{financialAccounts.length} lançamentos</span>
                  </div>

                  {loading ? (
                    <div className="flex min-h-[240px] items-center justify-center p-6 text-sm font-medium text-[#64748B]" role="status">Carregando dados financeiros...</div>
                  ) : error ? (
                    <div className="flex min-h-[240px] items-center justify-center px-6 text-center" role="alert"><div><p className="text-sm font-semibold text-[#DC2626]">Não foi possível carregar o financeiro.</p><p className="mt-1 text-xs text-[#64748B]">{error}</p></div></div>
                  ) : sortedAccounts.length === 0 ? (
                    <div className="flex min-h-[240px] items-center justify-center px-6 text-center"><div><p className="text-sm font-semibold text-[#0B2947]">Nenhuma conta financeira encontrada.</p><p className="mt-1 text-xs text-[#64748B]">Cadastre uma nova conta para começar o acompanhamento.</p><Link href="/financeiro/nova" className="mt-3 inline-block text-sm font-semibold text-[#154B7A] hover:underline">Criar conta</Link></div></div>
                  ) : (
                    <>
                      <div className="divide-y divide-[#F1F5F9] md:hidden">
                        {sortedAccounts.map((item) => (
                          <button key={item.id} type="button" onClick={() => router.push(`/financeiro/${item.id}`)} className="block w-full p-4 text-left transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#154B7A]/30">
                            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-semibold text-[#0F172A]">{item.description}</p><p className="mt-1 text-[10px] text-[#94A3B8]">{item.documentNumber ?? "Sem documento"}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.type === "PAYABLE" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{item.type === "PAYABLE" ? "Pagar" : "Receber"}</span></div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-[#64748B]">Vence {formatDate(item.dueDate)}</p><p className="mt-1 text-sm font-bold text-[#0F172A]">{formatCurrency(item.amount)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(item, today)}`}>{getStatusLabel(item, today)}</span></div>
                          </button>
                        ))}
                      </div>

                      <div className="hidden overflow-auto md:block">
                        <table className="w-full min-w-[700px] border-collapse">
                          <thead className="sticky top-0 z-10 bg-[#F8FAFC]"><tr className="border-b border-[#E2E8F0] text-left">{["Descrição", "Tipo", "Vencimento", "Valor", "Status"].map((label) => <th key={label} scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">{label}</th>)}</tr></thead>
                          <tbody>
                            {sortedAccounts.map((item) => (
                              <tr key={item.id} tabIndex={0} onClick={() => router.push(`/financeiro/${item.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") router.push(`/financeiro/${item.id}`); }} className="cursor-pointer border-b border-[#F1F5F9] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#154B7A]/30">
                                <td className="px-4 py-3"><p className="text-sm font-semibold text-[#0F172A]">{item.description}</p><p className="mt-0.5 text-[10px] text-[#94A3B8]">{item.documentNumber ?? "Sem documento"}</p></td>
                                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.type === "PAYABLE" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{item.type === "PAYABLE" ? "Pagar" : "Receber"}</span></td>
                                <td className="px-4 py-3 text-xs font-semibold text-[#475569]">{formatDate(item.dueDate)}</td>
                                <td className="px-4 py-3 text-xs font-bold text-[#0F172A]">{formatCurrency(item.amount)}</td>
                                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(item, today)}`}>{getStatusLabel(item, today)}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid min-w-0 content-start gap-4">
                <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Controle Financeiro</p>
                  <h3 className="mt-2 text-lg font-bold">Posição do caixa</h3>
                  <div className="mt-5 space-y-3"><div className="flex justify-between gap-3 text-sm"><span className="text-white/70">A receber</span><span className="break-words text-right font-semibold">{formatCurrency(totalReceivable)}</span></div><div className="flex justify-between gap-3 text-sm"><span className="text-white/70">A pagar</span><span className="break-words text-right font-semibold">{formatCurrency(totalPayable)}</span></div><div className="border-t border-white/10 pt-3"><div className="flex flex-wrap justify-between gap-3"><span className="text-sm text-white/75">Resultado projetado</span><span className={`break-words text-lg font-bold ${projectedBalance >= 0 ? "text-[#8CC4EA]" : "text-red-300"}`}>{formatCurrency(projectedBalance)}</span></div></div></div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                  <div className="border-b border-[#E2E8F0] px-4 py-3"><h3 className="text-sm font-bold text-[#0B2947]">Próximos vencimentos</h3><p className="mt-0.5 text-[11px] text-[#94A3B8]">Obrigações financeiras por data.</p></div>
                  {upcomingAccounts.length === 0 ? <p className="p-4 text-sm text-[#64748B]">Nenhum vencimento pendente.</p> : <div className="divide-y divide-[#E2E8F0]">{upcomingAccounts.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#0F172A]">{item.description}</p><p className="mt-0.5 text-[10px] text-[#94A3B8]">{formatDate(item.dueDate)}</p></div><div className="shrink-0 text-right"><p className={`text-xs font-bold ${item.type === "PAYABLE" ? "text-[#DC2626]" : "text-[#16A34A]"}`}>{formatCurrency(item.amount)}</p><p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-[#94A3B8]">{item.type === "PAYABLE" ? "Pagar" : "Receber"}</p></div></div>)}</div>}
                </div>
              </div>
            </section>
          </div>
        </div>
      </AppShell>
    </PermissionGuard>
  );
}
