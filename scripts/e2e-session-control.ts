import { prisma } from "../lib/prisma";

const environment = process.env.BRAVHAS_ENV?.toUpperCase();
if (environment !== "TEST" && environment !== "HOMOLOGATION") {
  throw new Error("E2E session control recusado fora de TEST/HOMOLOGATION.");
}

const [action, tokenHash] = process.argv.slice(2);
if (action !== "revoke" && action !== "expire") {
  throw new Error("Ação E2E inválida. Use revoke ou expire.");
}

if (!/^[a-f0-9]{64}$/i.test(tokenHash ?? "")) {
  throw new Error("Hash de sessão E2E inválido.");
}

async function main() {
  if (action === "revoke") {
    await prisma.userSession.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return;
  }

  await prisma.userSession.update({
    where: { tokenHash },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Falha no controle de sessão E2E.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
