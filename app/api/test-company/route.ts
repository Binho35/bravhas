import { NextResponse } from "next/server";

import { EnsureInitialCompanyUseCase } from "@/modules/auth/application/use-cases/EnsureInitialCompanyUseCase";

export async function GET() {
  try {
    const useCase =
      new EnsureInitialCompanyUseCase();

    const result =
      await useCase.execute();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Erro ao garantir empresa inicial:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível garantir a empresa inicial.",
      },
      {
        status: 500,
      },
    );
  }
}