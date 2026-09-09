import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

import { getServerAuthUser } from "@/modules/auth/server/session";

export default async function PessoasLayout({ children }: { children: ReactNode }) {
  const user = await getServerAuthUser();
  if (!user) notFound();
  if (user.role === "OWNER" || user.role === "ADMIN") return children;
  if (user.role === "FINANCIAL") redirect("/");
  notFound();
}
