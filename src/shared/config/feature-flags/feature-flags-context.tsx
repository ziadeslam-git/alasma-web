'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { getFeatureState, type FeatureKey, type FeatureState } from '@/shared/config/features';

import type { ResolvedFeatureStates } from './feature-flags';

const FeatureFlagsContext = createContext<ResolvedFeatureStates | null>(null);

export type FeatureFlagsProviderProps = {
  children: ReactNode;
  value: ResolvedFeatureStates | null;
};

export function FeatureFlagsProvider({ children, value }: FeatureFlagsProviderProps) {
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useResolvedFeatureState(key: FeatureKey): FeatureState {
  const context = useContext(FeatureFlagsContext);
  if (context && key in context) {
    return context[key];
  }
  return getFeatureState(key);
}

export function useIsFeatureLive(key: FeatureKey): boolean {
  return useResolvedFeatureState(key) === 'live';
}
