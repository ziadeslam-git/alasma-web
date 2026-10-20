import type { NextConfig } from 'next';

// Kept minimal on purpose: the ISR rules in the Architecture page (revalidate + tags) rely on the classic
// caching model, so cacheComponents and the other opt-in features are not enabled.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
