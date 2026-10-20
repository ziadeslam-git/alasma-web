import messages from '@/i18n/messages/ar.json';
import { Button, ButtonLink, type ButtonSize, type ButtonVariant } from '@/shared/ui/button';

import styles from '../components.module.css';

const variants: ButtonVariant[] = ['primary', 'outline', 'ghost', 'soft'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

export function ButtonSection() {
  const text = messages.devComponents;

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>{text.title}</h1>
      <h2 className={styles.heading}>{text.button.heading}</h2>

      <div className={styles.grid}>
        {variants.map((variant) => (
          <div key={variant} className={styles.card}>
            <h3 className={styles.subheading}>{text.button.variants[variant]}</h3>
            <div className={styles.row}>
              {sizes.map((size) => (
                <Button key={size} leadingIcon="heart" size={size} variant={variant}>
                  {text.button.action}
                </Button>
              ))}
            </div>
            <div className={styles.row}>
              <ButtonLink href="/dev/components" size="sm" variant={variant}>
                {text.button.internalLink}
              </ButtonLink>
              <ButtonLink
                href="https://example.com"
                size="sm"
                trailingIcon="arrow-r"
                variant={variant}
              >
                {text.button.externalLink}
              </ButtonLink>
            </div>
          </div>
        ))}
      </div>

      <h3 className={styles.subheading}>{text.button.states}</h3>
      <div className={styles.row}>
        <Button fullWidth={false} leadingIcon="search">
          {text.button.defaultState}
        </Button>
        <Button disabled>{text.button.disabledState}</Button>
        <Button loading>{text.button.loadingState}</Button>
        <Button label={text.button.iconOnlyLabel} leadingIcon="heart" />
      </div>
    </section>
  );
}
