import Link from 'next/link';
import messages from '@/i18n/messages/ar.json';
import { categoryRoute, routes } from '@/shared/config/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { EmptyState } from '@/shared/ui/empty-state';
import { SafeImage } from '@/shared/ui/safe-image';
import type { CategoryNode } from '../types';
import styles from './categories-view.module.css';

export function CategoriesView({ categories }: { categories: readonly CategoryNode[] | null }) {
  const name = messages.site.header.categories;
  return (
    <div className={styles.container}>
      <Breadcrumbs
        label={messages.catalog.detail.breadcrumbsLabel}
        items={[{ label: messages.site.header.home, href: routes.home }, { label: name }]}
      />
      <h1>{name}</h1>
      {categories?.length ? (
        <ul className={styles.grid}>
          {categories.map((category) => (
            <li key={category.id}>
              <Link className={styles.tile} href={categoryRoute(category.slug)}>
                {category.imageUrl ? (
                  <SafeImage alt="" decorative src={category.imageUrl} width={160} height={160} />
                ) : null}
                <span>{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="grid"
          title={messages.home.categories.emptyTitle}
          description={messages.home.categories.emptyDescription}
        />
      )}
    </div>
  );
}
