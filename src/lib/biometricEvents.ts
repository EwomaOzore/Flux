type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeBiometricPrefsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyBiometricPrefsChanged(): void {
  for (const fn of listeners) fn();
}
