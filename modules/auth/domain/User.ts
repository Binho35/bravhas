import type {
  AuthUser,
  AuthUserRole,
} from "../types/AuthUser";

export interface UserProps {
  id: string;

  companyId: string;

  branchId?: string | null;

  companyPrefix: string;

  username: string;

  name: string;

  email: string;

  role: AuthUserRole;

  active: boolean;

  createdAt: string;

  updatedAt: string;
}

function normalizeCompanyPrefix(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function normalizeUsername(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, "");
}

function buildLoginId(
  companyPrefix: string,
  username: string,
): string {
  return `${normalizeCompanyPrefix(
    companyPrefix,
  )}${normalizeUsername(
    username,
  )}`;
}

export class User {
  constructor(
    private readonly props: UserProps,
  ) {
    if (!props.id.trim()) {
      throw new Error(
        "O identificador do usuário é obrigatório.",
      );
    }

    if (!props.companyId.trim()) {
      throw new Error(
        "A empresa do usuário é obrigatória.",
      );
    }

    if (!props.companyPrefix.trim()) {
      throw new Error(
        "O prefixo da empresa é obrigatório.",
      );
    }

    if (
      normalizeCompanyPrefix(
        props.companyPrefix,
      ).length < 2
    ) {
      throw new Error(
        "O prefixo da empresa deve possuir ao menos 2 caracteres.",
      );
    }

    if (!props.username.trim()) {
      throw new Error(
        "O identificador do usuário é obrigatório.",
      );
    }

    if (
      normalizeUsername(
        props.username,
      ).length < 3
    ) {
      throw new Error(
        "O identificador do usuário deve possuir ao menos 3 caracteres.",
      );
    }

    if (!props.name.trim()) {
      throw new Error(
        "O nome do usuário é obrigatório.",
      );
    }

    if (!props.email.trim()) {
      throw new Error(
        "O e-mail do usuário é obrigatório.",
      );
    }

    if (
      !props.email.includes("@")
    ) {
      throw new Error(
        "O e-mail do usuário é inválido.",
      );
    }
  }

  get data(): AuthUser {
    const companyPrefix =
      normalizeCompanyPrefix(
        this.props.companyPrefix,
      );

    const username =
      normalizeUsername(
        this.props.username,
      );

    return {
      id:
        this.props.id,

      companyId:
        this.props.companyId,

      branchId:
        this.props.branchId ??
        null,

      companyPrefix,

      username,

      loginId:
        buildLoginId(
          companyPrefix,
          username,
        ),

      name:
        this.props.name.trim(),

      email:
        this.props.email
          .trim()
          .toLowerCase(),

      role:
        this.props.role,

      active:
        this.props.active,

      createdAt:
        this.props.createdAt,

      updatedAt:
        this.props.updatedAt,
    };
  }

  updateName(
    name: string,
  ): User {
    if (!name.trim()) {
      throw new Error(
        "O nome do usuário é obrigatório.",
      );
    }

    return new User({
      ...this.props,

      name:
        name.trim(),

      updatedAt:
        new Date().toISOString(),
    });
  }

  updateUsername(
    username: string,
  ): User {
    if (!username.trim()) {
      throw new Error(
        "O identificador do usuário é obrigatório.",
      );
    }

    return new User({
      ...this.props,

      username:
        normalizeUsername(
          username,
        ),

      updatedAt:
        new Date().toISOString(),
    });
  }

  updateCompanyPrefix(
    companyPrefix: string,
  ): User {
    if (!companyPrefix.trim()) {
      throw new Error(
        "O prefixo da empresa é obrigatório.",
      );
    }

    return new User({
      ...this.props,

      companyPrefix:
        normalizeCompanyPrefix(
          companyPrefix,
        ),

      updatedAt:
        new Date().toISOString(),
    });
  }

  updateRole(
    role: AuthUserRole,
  ): User {
    return new User({
      ...this.props,

      role,

      updatedAt:
        new Date().toISOString(),
    });
  }

  deactivate(): User {
    return new User({
      ...this.props,

      active: false,

      updatedAt:
        new Date().toISOString(),
    });
  }

  activate(): User {
    return new User({
      ...this.props,

      active: true,

      updatedAt:
        new Date().toISOString(),
    });
  }
}