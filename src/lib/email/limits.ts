export type WindowState = { count: number; resetAt: number; lastAt: number };

export function consumeEmailWindow(state: Partial<WindowState> | undefined, now: number, limit: number, duration: number, cooldown = 0): WindowState | null {
  const current = state?.resetAt && state.resetAt > now ? state : { count: 0, resetAt: now + duration, lastAt: 0 };
  if ((current.count ?? 0) >= limit || ((current.count ?? 0) > 0 && now - (current.lastAt ?? 0) < cooldown)) return null;
  return { count: (current.count ?? 0) + 1, resetAt: current.resetAt!, lastAt: now };
}
