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

export function seedInitialOwner(): SeedInitialOwnerResult {
  const existingUser =
    findAuthUserByLoginId(
      INITIAL_OWNER_LOGIN_ID,
    );

  if (existingUser) {
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

  return {
    created: true,

    loginId:
      ownerData.loginId,
  };
}