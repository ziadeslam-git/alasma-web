// The package the visitor chose with "اطلب هذه الباقة": the card button stores it, the request form reads it. Memory
// only (nothing is written to web storage).
let selected: number | null = null;
const listeners = new Set<() => void>();

export const packageSelection = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => selected,
  getServerSnapshot: () => null as number | null,
};

export function selectPackage(id: number | null) {
  selected = id;
  listeners.forEach((listener) => listener());
}
