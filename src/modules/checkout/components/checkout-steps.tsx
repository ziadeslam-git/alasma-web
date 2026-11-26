import Link from 'next/link';
import messages from '@/i18n/messages/ar.json';
import { routes } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/icon';
import styles from './checkout-steps.module.css';

// The breadcrumb and the static three-step bar. The page is always step two.
export function CheckoutSteps() {
  const text = messages.checkout;
  const steps = [
    { label: text.stepCart, isOn: true },
    { label: text.stepShippingPayment, isOn: true, isCurrent: true },
    { label: text.stepConfirm, isOn: false },
  ];
  return (
    <>
      <nav aria-label={text.breadcrumbLabel} className={styles.crumb}>
        <Link href={routes.cart}>{text.stepCart}</Link>
        <Icon name="chev-l" size="sm" />
        <b aria-current="page">{text.title}</b>
      </nav>
      <ol aria-label={text.stepsLabel} className={styles.steps}>
        {steps.map((step, index) => (
          <li
            aria-current={step.isCurrent ? 'step' : undefined}
            className={step.isOn ? `${styles.step} ${styles.on}` : styles.step}
            key={step.label}
          >
            <i className={styles.number}>{index + 1}</i>
            {step.label}
          </li>
        ))}
      </ol>
    </>
  );
}
