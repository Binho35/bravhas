import { prisma } from "@/lib/prisma";
import { getServerAuthUser } from "./session";

export async function requireMasterAccess() {
  const user = await getServerAuthUser();
  if (!user) throw new Error("Sessão inválida ou expirada.");
  if (user.role === "OWNER" || user.role === "ADMIN") return user;

  const accessProfile = await prisma.userAccessProfile.findFirst({
    where: {
      userId: user.id,
      profile: {
        companyId: user.companyId,
        active: true,
        master: true,
      },
    },
    select: { userId: true },
  });

  if (!accessProfile) throw new Error("Acesso MASTER necessário.");
  return user;
}
