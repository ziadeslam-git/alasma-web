'use client';

import { useState } from 'react';

import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Drawer } from '@/shared/ui/drawer';
import { Icon } from '@/shared/ui/icon';

import { useCatalogNavigation } from '../hooks/use-catalog-navigation';
import { clearFilters, countActiveFilters, withFilter } from '../url/catalog-href';
import type { CatalogParams } from '../url/catalog-params';
import type { FilterOptions } from '../types';
import { FilterFields } from './filter-fields';
import styles from './filter-panel.module.css';

export type FilterPanelProps = {
  basePath: string;
  options: FilterOptions;
  params: CatalogParams;
};

// Above 1000px the filters are a sidebar and every change goes straight into the URL. At or below 1000px a button opens
// them in a Drawer; as in the design, the sheet works on a draft and "apply" writes it into the URL once.
export function FilterPanel({ basePath, options, params }: FilterPanelProps) {
  const text = messages.catalog.filters;
  const { isPending, navigate } = useCatalogNavigation(basePath);
  const [isOpen, setOpen] = useState(false);
  const [draft, setDraft] = useState(params);
  const activeCount = countActiveFilters(params);

  function openSheet() {
    setDraft(params);
    setOpen(true);
  }

  function applyDraft() {
    setOpen(false);
    navigate(withFilter(draft, {}));
  }

  return (
    <>
      <div className={styles.mobileBar}>
        <button
          aria-haspopup="dialog"
          aria-label={
            activeCount > 0
              ? text.openWithCount.replace('{count}', formatNumber(activeCount))
              : undefined
          }
          className={styles.trigger}
          onClick={openSheet}
          type="button"
        >
          <Icon name="filter" size="sm" />
          {text.open}
          {activeCount > 0 ? (
            <b aria-hidden="true" className={styles.badge} data-testid="filter-count">
              {formatNumber(activeCount)}
            </b>
          ) : null}
        </button>
      </div>

      <aside
        aria-busy={isPending || undefined}
        aria-label={text.panelLabel}
        className={styles.sidebar}
      >
        <div className={styles.header}>
          <h2 className={styles.heading}>{text.title}</h2>
          {activeCount > 0 ? (
            <button
              className={styles.clear}
              onClick={() => navigate(clearFilters(params))}
              type="button"
            >
              {text.clearAll}
            </button>
          ) : null}
        </div>
        <FilterFields onChange={navigate} options={options} params={params} />
      </aside>

      <Drawer
        closeLabel={text.close}
        footer={
          <>
            <Button fullWidth onClick={applyDraft}>
              {text.apply}
            </Button>
            <Button fullWidth onClick={() => setDraft(clearFilters(draft))} variant="outline">
              {text.clearAll}
            </Button>
          </>
        }
        onOpenChange={setOpen}
        open={isOpen}
        title={text.title}
      >
        <FilterFields onChange={setDraft} options={options} params={draft} priceDebounceMs={0} />
      </Drawer>
    </>
  );
}
