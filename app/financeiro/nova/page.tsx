"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";
import type { FinancialAccountType } from "@/modules/financial/domain/entities/FinancialAccount";

export default function NovaContaFinanceiraPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [type, setType] = useState<FinancialAccountType>("PAYABLE");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [costCenterName, setCostCenterName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const numericAmount = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!description.trim()) return setError("Informe a descrição da conta.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError("Informe um valor válido.");
    if (!dueDate) return setError("Informe a data de vencimento.");

    try {
      setSaving(true);
      const response = await fetch("/api/financeiro/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          type,
          amount: numericAmount,
          dueDate: `${dueDate}T12:00:00`,
          documentNumber: documentNumber.trim() || null,
          categoryName: categoryName.trim() || null,
          costCenterName: costCenterName.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message ?? "Não foi possível salvar a conta.");
      router.push("/financeiro");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a conta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGuard resource="FINANCIAL" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <div className="grid h-full grid-rows-[auto_1fr] gap-4 overflow-hidden p-5">
          <section className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Financeiro</p>
              <h2 className="mt-1 text-2xl font-bold text-[#0B2947]">Nova Conta Financeira</h2>
              <p className="mt-1 text-sm text-[#64748B]">Cadastre contas a pagar ou receber com persistência no BravHAS.</p>
            </div>
            <button type="button" onClick={() => router.push("/financeiro")} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#475569]">Voltar</button>
          </section>

          <form onSubmit={handleSave} className="grid min-h-0 grid-cols-[1.3fr_0.7fr] gap-4">
            <div className="min-h-0 overflow-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <label className="col-span-2 text-xs font-semibold text-[#334155]">Descrição
                  <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" placeholder="Ex.: Pagamento fornecedor contábil" />
                </label>
                <label className="text-xs font-semibold text-[#334155]">Tipo
                  <select value={type} onChange={(e) => setType(e.target.value as FinancialAccountType)} className="mt-1.5 h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm">
                    <option value="PAYABLE">Conta a pagar</option>
                    <option value="RECEIVABLE">Conta a receber</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-[#334155]">Valor
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="mt-1.5 h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" placeholder="0,00" />
                </label>
                <label className="text-xs font-semibold text-[#334155]">Vencimento
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" />
                </label>
                <label className="text-xs font-semibold text-[#334155]">Documento
                  <input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" placeholder="NF, boleto, guia..." />
                </label>
                <label className="text-xs font-semibold text-[#334155]">Categoria
                  <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" placeholder="Ex.: Tributos" />
                </label>
                <label className="text-xs font-semibold text-[#334155]">Centro de custo
                  <input value={costCenterName} onChange={(e) => setCostCenterName(e.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm" placeholder="Ex.: Administrativo" />
                </label>
                <label className="col-span-2 text-xs font-semibold text-[#334155]">Observações
                  <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5 w-full resize-none rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm" />
                </label>
              </div>
            </div>

            <div className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4">
              <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Harpia</p>
                <h3 className="mt-2 text-lg font-bold">Assistente Financeira</h3>
                <p className="mt-4 text-sm leading-6 text-white/70">O lançamento será persistido na empresa autenticada e alimentará os indicadores financeiros.</p>
              </div>
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#0B2947]">Conferência</h3>
                <p className="mt-3 text-xs leading-5 text-[#64748B]">Confira tipo, valor, vencimento, documento, categoria e centro de custo antes de salvar.</p>
                {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-[#DC2626]">{error}</div> : null}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => router.push("/financeiro")} className="h-10 flex-1 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569]">Cancelar</button>
                <button type="submit" disabled={saving} className="h-10 flex-1 rounded-xl bg-[#154B7A] text-sm font-semibold text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar Conta"}</button>
              </div>
            </div>
          </form>
        </div>
      </AppShell>
    </PermissionGuard>
  );
}
