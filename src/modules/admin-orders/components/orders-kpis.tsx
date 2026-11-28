'use client';

import messages from '@/i18n/messages/ar.json';
import { formatNumber } from '@/shared/lib/format';
import { Skeleton } from '@/shared/ui/skeleton';

import { KPI_KEYS, useOrderKpis, type KpiKey, type KpiValue } from '../hooks/use-order-kpis';
import styles from './admin-orders.module.css';

const copy = messages.admin.orders;
// The second card is the one the frame draws in red: payments waiting for review need the owner.
const WARNING_KEY: KpiKey = 'review';

function KpiNumber({ value }: { value: KpiValue }) {
  if (value.state === 'loading') return <Skeleton shape="block" size="sm" />;

  if (value.state === 'error') {
    return (
      <>
        <span aria-hidden="true">—</span>
        <span className={styles.srOnly}>{copy.kpiUnavailable}</span>
      </>
    );
  }

  return <>{formatNumber(value.value)}</>;
}

// design/AdmOrders.dc.html .ks: today, waiting for payment review, being prepared, on the way. The numbers are the
// API's own totals, not computed here; a card whose request failed shows a dash.
export function OrdersKpis() {
  const kpis = useOrderKpis();

  return (
    <section aria-label={copy.kpiLabel} className={styles.kpis}>
      {KPI_KEYS.map((key) => (
        <div
          key={key}
          className={`${styles.kpi} ${key === WARNING_KEY ? styles.kpiWarn : ''}`}
          data-kpi={key}
        >
          <span className={styles.kpiLabel}>{copy.kpis[key]}</span>
          <b className={styles.kpiValue}>
            <KpiNumber value={kpis[key]} />
          </b>
        </div>
      ))}
    </section>
  );
}
