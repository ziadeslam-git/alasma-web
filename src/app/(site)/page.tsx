import type { Metadata } from 'next';

import messages from '@/i18n/messages/ar.json';
import { getHomeData, HomeView } from '@/modules/home';

export const revalidate = 300;

export const metadata: Metadata = {
  title: messages.home.meta.title,
  description: messages.home.meta.description,
};

// Home page (ISR, 5 minutes). SiteShell owns the only <main>, so HomeView renders directly inside it.
export default async function HomePage() {
  const data = await getHomeData();

  return <HomeView data={data} />;
}
