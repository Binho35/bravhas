import { PrismaCompanyRepository } from "../../infrastructure/repositories/PrismaCompanyRepository";

export interface EnsureInitialCompanyResult {
  companyId: string;
  created: boolean;
}

const INITIAL_COMPANY = {
  id: "COMPANY-STOCCO-001",
  name: "Grupo Stocco Advogados",
  prefix: "stocco",
  active: true,
};

export class EnsureInitialCompanyUseCase {
  constructor(
    private readonly companyRepository =
      new PrismaCompanyRepository(),
  ) {}

  async execute(): Promise<EnsureInitialCompanyResult> {
    const existingCompany =
      await this.companyRepository.findById(
        INITIAL_COMPANY.id,
      );

    if (existingCompany) {
      return {
        companyId:
          existingCompany.id,
        created: false,
      };
    }

    const company =
      await this.companyRepository.create(
        INITIAL_COMPANY,
      );

    return {
      companyId: company.id,
      created: true,
    };
  }
}