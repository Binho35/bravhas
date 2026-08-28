import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword } from "../modules/auth/server/password";

const connectionString = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
const loginId = process.env.BRAVHAS_PASSWORD_LOGIN?.trim();
const password = process.env.BRAVHAS_PASSWORD_VALUE;

if (!connectionString) throw new Error("DATABASE_DIRECT_URL ou DATABASE_URL precisa estar configurada.");
if (!loginId || !password) {
  throw new Error("Defina BRAVHAS_PASSWORD_LOGIN e BRAVHAS_PASSWORD_VALUE para provisionar a credencial.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const user = await prisma.user.findFirst({
    where: { loginId: { equals: loginId, mode: "insensitive" }, active: true },
    select: { id: true, loginId: true },
  });

  if (!user) throw new Error("Usuário ativo não encontrado.");

  const passwordHash = hashPassword(password);
  await prisma.$executeRaw`
    UPDATE "User"
    SET "passwordHash" = ${passwordHash}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${user.id}
  `;

  await prisma.userSession.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  console.log(`Credencial atualizada para ${user.loginId}. Sessões anteriores foram revogadas.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
