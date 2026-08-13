import type { AuthUser } from "../../types/AuthUser";

import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";

export interface AuthenticateUserInput {
  loginId: string;
  password: string;
}

export interface AuthenticateUserResult {
  user: AuthUser;
}

const DEVELOPMENT_PASSWORD =
  "BravHAS@123";

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository =
      new PrismaUserRepository(),
  ) {}

  async execute(
    input: AuthenticateUserInput,
  ): Promise<AuthenticateUserResult> {
    const normalizedLoginId =
      input.loginId
        .trim()
        .toLowerCase();

    if (!normalizedLoginId) {
      throw new Error(
        "Informe o login.",
      );
    }

    if (!input.password.trim()) {
      throw new Error(
        "Informe a senha.",
      );
    }

    const user =
      await this.userRepository.findByLoginId(
        normalizedLoginId,
      );

    if (!user) {
      throw new Error(
        "Usuário não encontrado.",
      );
    }

    if (!user.active) {
      throw new Error(
        "Este usuário está inativo.",
      );
    }

    if (
      input.password !==
      DEVELOPMENT_PASSWORD
    ) {
      throw new Error(
        "Login ou senha inválidos.",
      );
    }

    return {
      user,
    };
  }
}