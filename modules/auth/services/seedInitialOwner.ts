import {
  addAuthUser,
  findAuthUserByLoginId,
} from "../storage/authStorage";

import {
  User,
} from "../domain/User";

export interface SeedInitialOwnerResult {
  created: boolean;

  loginId: string;
}

const INITIAL_OWNER_LOGIN_ID =
  "stoccoRobson35";

const FINANCIAL_TEST_LOGIN_ID =
  "stoccoFinanceiro01";

function seedFinancialTestUser(): void {
  const existingUser =
    findAuthUserByLoginId(
      FINANCIAL_TEST_LOGIN_ID,
    );

  if (existingUser) {
    return;
  }

  const now =
    new Date().toISOString();

  const financialUser =
    new User({
      id:
        "USR-STOCCO-FINANCIAL-001",

      companyId:
        "COMPANY-STOCCO-001",

      branchId:
        null,

      companyPrefix:
        "stocco",

      username:
        "Financeiro01",

      name:
        "Financeiro",

      email:
        "financeiro@stocco.local",

      role:
        "FINANCIAL",

      active:
        true,

      createdAt:
        now,

      updatedAt:
        now,
    });

  addAuthUser(
    financialUser.data,
  );
}

export function seedInitialOwner(): SeedInitialOwnerResult {
  const existingUser =
    findAuthUserByLoginId(
      INITIAL_OWNER_LOGIN_ID,
    );

  if (existingUser) {
    seedFinancialTestUser();

    return {
      created: false,

      loginId:
        existingUser.loginId,
    };
  }

  const now =
    new Date().toISOString();

  const owner =
    new User({
      id:
        "USR-STOCCO-OWNER-001",

      companyId:
        "COMPANY-STOCCO-001",

      branchId:
        null,

      companyPrefix:
        "stocco",

      username:
        "Robson35",

      name:
        "Robson",

      email:
        "robson@stocco.local",

      role:
        "OWNER",

      active:
        true,

      createdAt:
        now,

      updatedAt:
        now,
    });

  const ownerData =
    owner.data;

  addAuthUser(
    ownerData,
  );

  seedFinancialTestUser();

  return {
    created: true,

    loginId:
      ownerData.loginId,
  };
}