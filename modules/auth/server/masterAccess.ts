import { prisma } from "@/lib/prisma";
import { getServerAuthUser } from "./session";

export async function requireMasterAccess() {
  const user = await getServerAuthUser();
  if (!user) throw new Error("Sessão inválida ou expirada.");
  if (user.role === "OWNER" || user.role === "ADMIN") return user;

  const rows = await prisma.$queryRawUnsafe<Array<{ master: boolean }>>(
    `SELECT p."master" FROM "UserAccessProfile" u JOIN "AccessProfile" p ON p."id"=u."profileId" WHERE u."userId"=$1 AND p."companyId"=$2 AND p."active"=true LIMIT 1`,
    user.id,
    user.companyId,
  );

  if (!rows[0]?.master) throw new Error("Acesso MASTER necessário.");
  return user;
}
