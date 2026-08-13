import { NextResponse } from "next/server";

import { AuthenticateUserUseCase } from "@/modules/auth/application/use-cases/AuthenticateUserUseCase";

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();

    const loginId =
      typeof body.loginId === "string"
        ? body.loginId
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const useCase =
      new AuthenticateUserUseCase();

    const result =
      await useCase.execute({
        loginId,
        password,
      });

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error(
      "Erro na autenticação:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível realizar o login.",
      },
      {
        status: 401,
      },
    );
  }
}