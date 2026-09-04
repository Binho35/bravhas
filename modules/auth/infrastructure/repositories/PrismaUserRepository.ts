import { prisma } from "@/lib/prisma";

import type { AuthUser } from "../../types/AuthUser";

export class PrismaUserRepository {
  async findById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.toAuthUser(user) : null;
  }

  async findByLoginId(loginId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findFirst({
      where: {
        loginId: {
          equals: loginId,
          mode: "insensitive",
        },
      },
    });

    return user ? this.toAuthUser(user) : null;
  }

  async findPasswordHashById(id: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { passwordHash: true },
    });

    return user?.passwordHash ?? null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    return user ? this.toAuthUser(user) : null;
  }

  async findAllByCompany(companyId: string): Promise<AuthUser[]> {
    const users = await prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });

    return users.map((user) => this.toAuthUser(user));
  }

  async create(user: AuthUser): Promise<AuthUser> {
    const created = await prisma.user.create({
      data: {
        id: user.id,
        companyId: user.companyId,
        branchId: user.branchId,
        companyPrefix: user.companyPrefix,
        username: user.username,
        loginId: user.loginId,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
    });

    return this.toAuthUser(created);
  }

  async update(user: AuthUser): Promise<AuthUser> {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        companyId: user.companyId,
        branchId: user.branchId,
        companyPrefix: user.companyPrefix,
        username: user.username,
        loginId: user.loginId,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        updatedAt: new Date(user.updatedAt),
      },
    });

    return this.toAuthUser(updated);
  }

  async deactivate(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        active: false,
        updatedAt: new Date(),
      },
    });
  }

  private toAuthUser(user: {
    id: string;
    companyId: string;
    branchId: string | null;
    companyPrefix: string;
    username: string;
    loginId: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AuthUser {
    return {
      id: user.id,
      companyId: user.companyId,
      branchId: user.branchId,
      companyPrefix: user.companyPrefix,
      username: user.username,
      loginId: user.loginId,
      name: user.name,
      email: user.email,
      role: user.role as AuthUser["role"],
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
