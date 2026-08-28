import type { AuthUser } from "../../types/AuthUser";
import { PrismaUserRepository } from "../../infrastructure/repositories/PrismaUserRepository";
import { verifyPassword } from "../../server/password";

export interface AuthenticateUserInput {
  loginId: string;
  password: string;
}

export interface AuthenticateUserResult {
  user: AuthUser;
}

const INVALID_CREDENTIALS = "Login ou senha inválidos.";

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository = new PrismaUserRepository(),
  ) {}

  async execute(input: AuthenticateUserInput): Promise<AuthenticateUserResult> {
    const normalizedLoginId = input.loginId.trim().toLowerCase();
    const password = input.password;

    if (!normalizedLoginId || !password) {
      throw new Error(INVALID_CREDENTIALS);
    }

    const user = await this.userRepository.findByLoginId(normalizedLoginId);
    if (!user || !user.active) {
      throw new Error(INVALID_CREDENTIALS);
    }

    const passwordHash = await this.userRepository.findPasswordHashById(user.id);
    if (!passwordHash || !verifyPassword(password, passwordHash)) {
      throw new Error(INVALID_CREDENTIALS);
    }

    return { user };
  }
}
