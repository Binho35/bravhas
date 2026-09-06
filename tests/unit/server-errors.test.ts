import assert from "node:assert/strict";
import test from "node:test";

import { serverErrorStatus } from "../../lib/serverErrors";

test("maps Prisma serializable write conflicts to HTTP 409", () => {
  const error = Object.assign(new Error("transaction conflict"), { code: "P2034" });
  assert.equal(serverErrorStatus(error), 409);
});

test("keeps unknown internal failures as HTTP 500", () => {
  assert.equal(serverErrorStatus(new Error("unexpected")), 500);
});
