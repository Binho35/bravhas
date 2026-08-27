import Link from "next/link";
import { revalidatePath } from "next/cache";
import { BriefcaseBusiness, ClipboardList, Plus, UserCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function protocol() {
  const stamp = Date.now().toString(36).toUpperCase();
  return `R&S-${stamp}`;
}

async function createOpening(formData: FormData) {
  "use server";

  const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
  if (!company) throw new Error("Empresa ativa não encontrada.");

  const subject = text(formData, "subject");
  const description = text(formData, "description");
  if (!subject || !description) throw new Error("Título da vaga e descrição são obrigatórios.");

  await prisma.hrTicket.create({
    data: {
      companyId: company.id,
      protocol: protocol(),
      category: "RECRUTAMENTO",
      subject,
      description,
      priority: text(formData, "priority") ?? "NORMAL",
      assignedTo: text(formData, "assignedTo"),
    },
  });

  revalidatePath("/rh/recrutamento");
}

async function advanceOpening(formData: FormData) {
  "use server";

  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!id || !status) throw new Error("Solicitação inválida.");
  if (!["OPEN", "IN_PROGRESS", "WAITING_EMPLOYEE", "RESOLVED", "CLOSED"].includes(status)) {
    throw new Error("Status inválido.");
  }

  await prisma.hrTicket.update({
    where: { id },
    data: {
      status: status as "OPEN" | "IN_PROGRESS" | "WAITING_EMPLOYEE" | "RESOLVED" | "CLOSED",
      resolvedAt: ["RESOLVED", "CLOSED"].includes(status) ? new Date() : null,
    },
  });

  revalidatePath("/rh/recrutamento");
}

const statusLabel: Record<string, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em seleção",
  WAITING_EMPLOYEE: "Aguardando retorno",
  RESOLVED: "Vaga preenchida",
  CLOSED: "Encerrada",
};

export default async function RecruitmentPage() {
  const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
  const companyId = company?.id;

  const [openings, preAdmissions] = companyId
    ? await Promise.all([
        prisma.hrTicket.findMany({
          where: { companyId, category: "RECRUTAMENTO" },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.hrEmployee.findMany({
          where: { companyId, status: "PRE_ADMISSION" },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { department: true, position: true },
        }),
      ])
    : [[], []];

  const activeOpenings = openings.filter((item) => ["OPEN", "IN_PROGRESS", "WAITING_EMPLOYEE"].includes(item.status)).length;
  const inSelection = openings.filter((item) => item.status === "IN_PROGRESS").length;
  const filled = openings.filter((item) => item.status === "RESOLVED").length;

  return (
    <main className="px-4 py-6 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1360px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">RH · Recrutamento</p>
            <h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Recrutamento e Seleção</h1>
            <p className="mt-2 text-sm text-slate-600">Requisições de vaga, andamento da seleção e conversão dos aprovados para a pré-admissão.</p>
          </div>
          <Link href="/rh/colaboradores/novo" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white">
            <UserCheck className="h-4 w-4" /> Registrar aprovado
          </Link>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Vagas ativas", activeOpenings],
            ["Em seleção", inSelection],
            ["Pré-admissões", preAdmissions.length],
            ["Vagas preenchidas", filled],
          ].map(([label, value]) => (
            <article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">{label}</p>
              <strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
          <form action={createOpening} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5" /></div>
              <div><h2 className="font-bold text-[#0b2947]">Abrir requisição</h2><p className="text-xs text-slate-500">Formalize uma nova necessidade de contratação.</p></div>
            </div>
            <div className="mt-5 space-y-4">
              <input name="subject" required placeholder="Cargo / título da vaga" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
              <textarea name="description" required rows={5} placeholder="Perfil, quantidade, motivo, requisitos e observações" className="w-full rounded-2xl border border-slate-200 p-4 text-sm" />
              <select name="priority" className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" defaultValue="NORMAL">
                <option value="NORMAL">Prioridade normal</option><option value="ALTA">Alta prioridade</option><option value="URGENTE">Urgente</option>
              </select>
              <input name="assignedTo" placeholder="Responsável pelo processo" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b2947] text-sm font-semibold text-white"><BriefcaseBusiness className="h-4 w-4" />Abrir vaga</button>
            </div>
          </form>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 p-6"><ClipboardList className="h-5 w-5 text-[#154b7a]" /><div><h2 className="font-bold text-[#0b2947]">Pipeline de vagas</h2><p className="text-xs text-slate-500">Requisições e estágio atual do processo seletivo.</p></div></div>
            {openings.length === 0 ? <div className="p-14 text-center text-sm text-slate-500">Nenhuma vaga registrada.</div> : (
              <div className="divide-y divide-slate-100">
                {openings.map((item) => (
                  <div key={item.id} className="grid gap-3 p-5 lg:grid-cols-[1.4fr_1fr_1fr_190px] lg:items-center">
                    <div><p className="font-semibold text-slate-800">{item.subject}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p><p className="mt-1 text-[11px] text-slate-400">{item.protocol}</p></div>
                    <div className="text-sm text-slate-600"><p className="text-xs text-slate-400">Responsável</p><p>{item.assignedTo ?? "Não definido"}</p></div>
                    <span className="w-fit rounded-full bg-[#eaf3fb] px-2.5 py-1 text-[11px] font-semibold text-[#154b7a]">{statusLabel[item.status] ?? item.status}</span>
                    <form action={advanceOpening} className="flex gap-2"><input type="hidden" name="id" value={item.id} /><select name="status" defaultValue={item.status} className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 px-2 text-xs"><option value="OPEN">Aberta</option><option value="IN_PROGRESS">Em seleção</option><option value="WAITING_EMPLOYEE">Aguardando retorno</option><option value="RESOLVED">Preenchida</option><option value="CLOSED">Encerrada</option></select><button className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700">Salvar</button></form>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div><h2 className="font-bold text-[#0b2947]">Aprovados encaminhados para admissão</h2><p className="mt-1 text-xs text-slate-500">Pessoas já convertidas para o fluxo formal de pré-admissão.</p></div>
          {preAdmissions.length === 0 ? <p className="mt-5 text-sm text-slate-500">Nenhum aprovado aguardando admissão.</p> : <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{preAdmissions.map((item) => <Link key={item.id} href={`/rh/colaboradores/${item.id}`} className="rounded-2xl border border-slate-200 p-4 transition hover:border-[#154b7a]"><p className="font-semibold text-[#0b2947]">{item.fullName}</p><p className="mt-1 text-xs text-slate-500">{item.position?.name ?? "Cargo não definido"} · {item.department?.name ?? "Setor não definido"}</p></Link>)}</div>}
        </section>
      </div>
    </main>
  );
}
