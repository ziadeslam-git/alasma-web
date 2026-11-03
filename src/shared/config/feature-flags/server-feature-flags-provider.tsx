import type { ReactNode } from 'react';

import { getResolvedFeatureFlags } from './feature-flags';
import { FeatureFlagsProvider } from './feature-flags-context';

export async function ServerFeatureFlagsProvider({ children }: { children: ReactNode }) {
  const resolved = await getResolvedFeatureFlags();
  return <FeatureFlagsProvider value={resolved}>{children}</FeatureFlagsProvider>;
}
