import type {
  AuthUserRole,
} from "../types/AuthUser";

export type PermissionAction =
  | "VIEW"
  | "CREATE"
  | "EDIT"
  | "DELETE"
  | "APPROVE"
  | "EXPORT"
  | "MANAGE";

export type PermissionResource =
  | "DASHBOARD"
  | "OBLIGATIONS"
  | "AGENDA"
  | "FINANCIAL"
  | "CASH_FLOW"
  | "PEOPLE"
  | "PAYROLL"
  | "INDICATORS"
  | "DOCUMENTS"
  | "USERS"
  | "SETTINGS";

export interface PermissionProps {
  id: string;

  role: AuthUserRole;

  resource: PermissionResource;

  actions: PermissionAction[];

  createdAt: string;

  updatedAt: string;
}

export class Permission {
  constructor(
    private readonly props: PermissionProps,
  ) {
    if (!props.id.trim()) {
      throw new Error(
        "O identificador da permissão é obrigatório.",
      );
    }

    if (
      props.actions.length === 0
    ) {
      throw new Error(
        "A permissão deve possuir ao menos uma ação.",
      );
    }
  }

  get data(): PermissionProps {
    return {
      ...this.props,

      actions: [
        ...this.props.actions,
      ],
    };
  }

  allows(
    action: PermissionAction,
  ): boolean {
    return this.props.actions.includes(
      action,
    );
  }

  addAction(
    action: PermissionAction,
  ): Permission {
    if (
      this.props.actions.includes(
        action,
      )
    ) {
      return this;
    }

    return new Permission({
      ...this.props,

      actions: [
        ...this.props.actions,
        action,
      ],

      updatedAt:
        new Date().toISOString(),
    });
  }

  removeAction(
    action: PermissionAction,
  ): Permission {
    const actions =
      this.props.actions.filter(
        (item) =>
          item !== action,
      );

    if (
      actions.length === 0
    ) {
      throw new Error(
        "A permissão deve possuir ao menos uma ação.",
      );
    }

    return new Permission({
      ...this.props,

      actions,

      updatedAt:
        new Date().toISOString(),
    });
  }
}