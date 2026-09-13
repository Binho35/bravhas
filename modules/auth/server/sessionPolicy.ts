export const SESSION_TOUCH_INTERVAL_MS = 60 * 1000;

export function shouldTouchSession(lastSeenAt: Date | null, now = new Date()): boolean {
  if (!lastSeenAt) {
    return true;
  }

  return now.getTime() - lastSeenAt.getTime() >= SESSION_TOUCH_INTERVAL_MS;
}
