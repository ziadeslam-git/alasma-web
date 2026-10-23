import Link from 'next/link';

import messages from '@/i18n/messages/ar.json';
import type { CategoryNode } from '@/modules/catalog';
import { categoryRoute } from '@/shared/config/routes';
import { EmptyState } from '@/shared/ui/empty-state';
import { Icon, type IconName } from '@/shared/ui/icon';

import type { HomeSectionResult } from '../types';
import styles from './home-categories-section.module.css';

export type HomeCategoriesSectionProps = {
  result: HomeSectionResult<CategoryNode>;
};

const categoryIcons: readonly IconName[] = ['book', 'book-open', 'bulb', 'lib', 'brain', 'smile'];

// REAL section: top-level categories from GET /categories, rendered as the ".gchip" pills of Main.dc.html.
export function HomeCategoriesSection({ result }: HomeCategoriesSectionProps) {
  const text = messages.home.categories;

  return (
    <section aria-labelledby="home-categories-heading" className={styles.section}>
      <h2 className={styles.heading} id="home-categories-heading">
        {text.heading}
      </h2>

      {result.status === 'ok' ? (
        <ul className={styles.chips}>
          {result.items.map((category, index) => {
            const iconName = categoryIcons[index % categoryIcons.length] ?? 'book';
            return (
              <li className={styles.chipItem} key={category.id}>
                <Link className={styles.chip} href={categoryRoute(category.slug)}>
                  <span aria-hidden="true" className={styles.iconCircle}>
                    <Icon name={iconName} size="sm" />
                  </span>
                  <span>{category.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          description={text.emptyDescription}
          headingLevel={3}
          icon="grid"
          title={text.emptyTitle}
        />
      )}
    </section>
  );
}
