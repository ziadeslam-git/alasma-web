import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';

import type { HomeData } from '../types';
import { HomeBooksShelf } from './home-books-shelf';
import { HomeCategoriesSection } from './home-categories-section';
import { HomeShowcaseSection } from './home-showcase-section';
import { HomeSoonSections } from './home-soon-sections';
import { ManifestoHero } from './manifesto-hero';
import styles from './home-view.module.css';

export type HomeViewProps = {
  data: HomeData;
};

// Pure Server Component view of the Home page. Used by both src/app/(site)/page.tsx and src/app/(dev)/dev/home/page.tsx.
// SiteShell owns the only <main>, so HomeView renders a wrapper <div> with section children.
export function HomeView({ data }: HomeViewProps) {
  const newArrivalsText = messages.home.newArrivals;
  const featuredText = messages.home.featured;

  return (
    <div className={styles.page}>
      <ManifestoHero />
      <HomeShowcaseSection />
      <HomeCategoriesSection result={data.categories} />
      <HomeBooksShelf
        emptyDescription={newArrivalsText.emptyDescription}
        emptyTitle={newArrivalsText.emptyTitle}
        heading={newArrivalsText.heading}
        headingId="home-new-arrivals-heading"
        result={data.newArrivals}
        subtitle={newArrivalsText.subtitle}
        viewAllHref={routes.books}
        viewAllLabel={newArrivalsText.viewAll}
      />
      <HomeBooksShelf
        emptyDescription={featuredText.emptyDescription}
        emptyTitle={featuredText.emptyTitle}
        heading={featuredText.heading}
        headingId="home-featured-heading"
        result={data.featured}
        subtitle={featuredText.subtitle}
        viewAllHref={routes.books}
        viewAllLabel={featuredText.viewAll}
      />
      <HomeSoonSections />
    </div>
  );
}
