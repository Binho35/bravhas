import { NextResponse } from "next/server";

import { EnsureInitialCompanyUseCase } from "@/modules/auth/application/use-cases/EnsureInitialCompanyUseCase";
import { EnsureInitialUsersUseCase } from "@/modules/auth/application/use-cases/EnsureInitialUsersUseCase";

export async function GET() {
  try {
    const companyUseCase =
      new EnsureInitialCompanyUseCase();

    const companyResult =
      await companyUseCase.execute();

    const usersUseCase =
      new EnsureInitialUsersUseCase();

    const usersResult =
      await usersUseCase.execute();

    return NextResponse.json({
      success: true,

      company: companyResult,

      users: usersResult,
    });
  } catch (error) {
    console.error(
      "Erro ao garantir dados iniciais:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Não foi possível garantir os dados iniciais.",
      },
      {
        status: 500,
      },
    );
  }
}