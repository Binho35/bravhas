import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileHeart,
  HeartHandshake,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { label: "Visão geral", href: "/pessoas", icon: LayoutDashboard },
  { label: "RH", href: "/rh", icon: HeartHandshake },
  { label: "Colaboradores", href: "/rh/colaboradores", icon: UsersRound },
  { label: "Admissões", href: "/rh/admissoes", icon: BadgeCheck },
  { label: "Recrutamento", href: "/rh/recrutamento", icon: BriefcaseBusiness },
  { label: "Desempenho", href: "/rh/desempenho", icon: Sparkles },
  { label: "Canal RH", href: "/rh/canal-rh", icon: MessageSquareText },
  { label: "DP", href: "/dp", icon: UserRoundCog },
  { label: "Ponto e jornada", href: "/dp/ponto", icon: ClipboardCheck },
  { label: "Férias", href: "/dp/ferias", icon: CalendarDays },
  { label: "Benefícios", href: "/dp/beneficios", icon: WalletCards },
  { label: "Afastamentos", href: "/dp/afastamentos", icon: FileHeart },
];

export function PeopleShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="hidden w-[286px] shrink-0 border-r border-white/10 bg-[#071d33] text-white xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-7">
            <Link href="/pessoas" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#154b7a] shadow-lg shadow-black/10">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-200">BravHAS</p>
                <p className="mt-1 text-base font-bold">Pessoas</p>
              </div>
            </Link>
          </div>

          <div className="px-4 py-5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Gestão de pessoas</p>
            <nav className="mt-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-[18px] w-[18px] text-blue-300 transition group-hover:text-white" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-70" />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Ambiente corporativo
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">Acessos por perfil, trilha de auditoria e proteção de dados sensíveis.</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 xl:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0b2947] text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">BravHAS</p>
                  <p className="text-sm font-bold text-slate-900">Pessoas</p>
                </div>
              </div>

              <div className="hidden md:block">
                <p className="text-xs font-medium text-slate-500">Grupo Stocco Advogados</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">Central de RH & Departamento Pessoal</p>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" aria-label="Notificações" className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-800">
                  <Bell className="h-[18px] w-[18px]" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf3fb] text-xs font-bold text-[#0b2947]">RH</div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-slate-900">Administração</p>
                    <p className="text-[11px] text-slate-500">RH & DP</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
