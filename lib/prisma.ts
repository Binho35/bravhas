import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não está configurada.",
  );
}

const directDatabaseUrl =
  connectionString.startsWith(
    "prisma+postgres://",
  )
    ? process.env.DATABASE_DIRECT_URL
    : connectionString;

if (!directDatabaseUrl) {
  throw new Error(
    "DATABASE_DIRECT_URL não está configurada para conexão direta com PostgreSQL.",
  );
}

const adapter =
  new PrismaPg({
    connectionString:
      directDatabaseUrl,
  });

const globalForPrisma =
  globalThis as unknown as {
    prisma?: PrismaClient;
  };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForPrisma.prisma =
    prisma;
}