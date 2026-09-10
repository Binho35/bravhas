import assert from "node:assert/strict";
import test from "node:test";

import {
  SESSION_TOUCH_INTERVAL_MS,
  shouldTouchSession,
} from "../../modules/auth/server/sessionPolicy";

test("session touch writes immediately when lastSeenAt is absent", () => {
  const now = new Date("2026-09-09T20:00:00.000Z");
  assert.equal(shouldTouchSession(null, now), true);
});

test("session touch skips repeated writes inside the throttle window", () => {
  const now = new Date("2026-09-09T20:00:30.000Z");
  const lastSeenAt = new Date(now.getTime() - (SESSION_TOUCH_INTERVAL_MS - 1));
  assert.equal(shouldTouchSession(lastSeenAt, now), false);
});

test("session touch resumes at the throttle boundary", () => {
  const now = new Date("2026-09-09T20:01:00.000Z");
  const lastSeenAt = new Date(now.getTime() - SESSION_TOUCH_INTERVAL_MS);
  assert.equal(shouldTouchSession(lastSeenAt, now), true);
});
