"use client";

import { CalendarDays, Clock3, CircleAlert, CalendarCheck2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { OperationalModulePage } from "@/components/layout/OperationalModulePage";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";

const metrics = [
  { label: "Hoje", value: "—", icon: CalendarDays },
  { label: "Esta semana", value: "—", icon: CalendarCheck2 },
  { label: "Próximos 30 dias", value: "—", icon: Clock3 },
  { label: "Atrasados", value: "—", icon: CircleAlert },
];

export default function AgendaPage() {
  return (
    <PermissionGuard resource="AGENDA" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <OperationalModulePage
          eyebrow="Operação"
          title="Agenda"
          description="Visão central dos compromissos administrativos, vencimentos e atividades que exigem acompanhamento."
          statusText="Rota disponível para homologação"
        >
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-[#64748B]">{label}</p>
                  <Icon size={17} className="text-[#154B7A]" aria-hidden="true" />
                </div>
                <p className="mt-2 text-2xl font-bold text-[#0B2947]">{value}</p>
              </div>
            ))}
          </section>

          <section className="min-h-[20rem] rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#0B2947]">Compromissos e vencimentos</h3>
            <p className="mt-1 text-xs text-[#94A3B8]">A tela está disponível sem dados fictícios. A integração de cadastro será homologada em ciclo próprio.</p>
            <div className="mt-8 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 py-10 text-center">
              <CalendarDays className="mx-auto text-[#94A3B8]" size={30} aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-[#475569]">Nenhum compromisso consolidado nesta visão.</p>
              <p className="mt-1 text-xs text-[#94A3B8]">Use Obrigações para registrar prazos operacionais enquanto o cadastro específico da Agenda é concluído.</p>
            </div>
          </section>
        </OperationalModulePage>
      </AppShell>
    </PermissionGuard>
  );
}
