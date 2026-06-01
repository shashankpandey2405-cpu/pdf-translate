/** Never let UI progress bars move backward when staging + timers both update. */
export function nextProgress(current: number, candidate: number): number {
  return Math.min(100, Math.max(current, candidate));
}
