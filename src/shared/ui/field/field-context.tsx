import { createContext, useContext } from 'react';

export type FieldContextValue = {
  describedBy?: string;
  error?: string;
  id: string;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

export const FieldProvider = FieldContext.Provider;

export function useFieldContext() {
  return useContext(FieldContext);
}
