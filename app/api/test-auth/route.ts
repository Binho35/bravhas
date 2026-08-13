import { NextResponse } from "next/server";

import { AuthenticateUserUseCase } from "@/modules/auth/application/use-cases/AuthenticateUserUseCase";

export async function GET() {
  try {
    const useCase =
      new AuthenticateUserUseCase();

    const result =
      await useCase.execute({
        loginId:
          "stoccoRobson35",
        password:
          "BravHAS@123",
      });

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error(
      "Erro ao autenticar usuário:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível autenticar o usuário.",
      },
      {
        status: 401,
      },
    );
  }
}