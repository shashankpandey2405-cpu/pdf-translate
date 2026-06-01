type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeShareNudge(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function triggerShareNudge(): void {
  for (const fn of listeners) fn();
}
