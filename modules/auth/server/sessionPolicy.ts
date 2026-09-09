export const SESSION_TOUCH_INTERVAL_MS = 60 * 1000;

export function shouldTouchSession(lastSeenAt: Date, now = new Date()): boolean {
  return now.getTime() - lastSeenAt.getTime() >= SESSION_TOUCH_INTERVAL_MS;
}
