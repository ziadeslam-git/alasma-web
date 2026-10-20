'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type FieldContextValue = {
  describedBy?: string;
  error?: string;
  id: string;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

// A component (not the raw Context.Provider) so a Server Component can render it: the context itself stays in
// the client module.
export function FieldProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FieldContextValue;
}) {
  return <FieldContext.Provider value={value}>{children}</FieldContext.Provider>;
}

export function useFieldContext() {
  return useContext(FieldContext);
}
