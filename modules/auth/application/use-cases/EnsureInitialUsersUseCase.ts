import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";

export interface EnsureInitialUsersResult {
  created: string[];
  existing: string[];
}

const INITIAL_USERS = [
  {
    id: "USR-STOCCO-OWNER-001",
    companyId: "COMPANY-STOCCO-001",
    branchId: null,
    companyPrefix: "stocco",
    username: "Robson35",
    loginId: "stoccoRobson35",
    name: "Robson",
    email: "robson@stocco.local",
    role: "OWNER" as const,
    active: true,
  },
  {
    id: "USR-STOCCO-FINANCIAL-001",
    companyId: "COMPANY-STOCCO-001",
    branchId: null,
    companyPrefix: "stocco",
    username: "Financeiro01",
    loginId: "stoccoFinanceiro01",
    name: "Financeiro",
    email: "financeiro@stocco.local",
    role: "FINANCIAL" as const,
    active: true,
  },
];

export class EnsureInitialUsersUseCase {
  constructor(
    private readonly userRepository =
      new PrismaUserRepository(),
  ) {}

  async execute(): Promise<EnsureInitialUsersResult> {
    const created: string[] = [];
    const existing: string[] = [];

    for (const initialUser of INITIAL_USERS) {
      const existingUser =
        await this.userRepository.findByLoginId(
          initialUser.loginId,
        );

      if (existingUser) {
        existing.push(
          initialUser.loginId,
        );

        continue;
      }

      const now =
        new Date().toISOString();

      await this.userRepository.create({
        ...initialUser,
        createdAt: now,
        updatedAt: now,
      });

      created.push(
        initialUser.loginId,
      );
    }

    return {
      created,
      existing,
    };
  }
}