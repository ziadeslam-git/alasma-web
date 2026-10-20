import type { ReactNode } from 'react';

// EXAMPLE (task F1.6): a tiny component to show the component + axe test shape. Replaced by the real Button in F1.7.
export function ExampleButton({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  );
}
