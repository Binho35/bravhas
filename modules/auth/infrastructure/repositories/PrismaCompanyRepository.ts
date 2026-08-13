import { prisma } from "@/lib/prisma";

export interface CompanyRecord {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaCompanyRepository {
  async findById(
    id: string,
  ): Promise<CompanyRecord | null> {
    return prisma.company.findUnique({
      where: {
        id,
      },
    });
  }

  async findByPrefix(
    prefix: string,
  ): Promise<CompanyRecord | null> {
    return prisma.company.findUnique({
      where: {
        prefix,
      },
    });
  }

  async findAll(): Promise<
    CompanyRecord[]
  > {
    return prisma.company.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async create(
    data: {
      id: string;
      name: string;
      prefix: string;
      active: boolean;
    },
  ): Promise<CompanyRecord> {
    return prisma.company.create({
      data: {
        id: data.id,
        name: data.name,
        prefix: data.prefix,
        active: data.active,
      },
    });
  }

  async update(
    data: {
      id: string;
      name: string;
      prefix: string;
      active: boolean;
    },
  ): Promise<CompanyRecord> {
    return prisma.company.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        prefix: data.prefix,
        active: data.active,
      },
    });
  }

  async deactivate(
    id: string,
  ): Promise<void> {
    await prisma.company.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
  }
}