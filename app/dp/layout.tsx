import type { ReactNode } from "react";
import { PeopleShell } from "@/components/hrdp/PeopleShell";

export default function DpLayout({ children }: { children: ReactNode }) {
  return <PeopleShell>{children}</PeopleShell>;
}
