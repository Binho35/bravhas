import type { ReactNode } from "react";
import { PeopleShell } from "@/components/hrdp/PeopleShell";

export default function RhLayout({ children }: { children: ReactNode }) {
  return <PeopleShell>{children}</PeopleShell>;
}
