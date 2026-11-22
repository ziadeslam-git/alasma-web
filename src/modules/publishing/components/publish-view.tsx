import messages from '@/i18n/messages/ar.json';
import { FeatureGate } from '@/shared/ui/soon';

import type { PackagesResult, PublishPackage } from '../api/publishing-api';
import { PackageCard } from './package-card';
import styles from './publishing.module.css';
import { RequestForm } from './request-form';

// The steps, the conditions and the author box come per package in the API, but the design shows them once for the
// page. They are taken from the highlighted package (the one with a badge), or the first one.
function referencePackage(result: PackagesResult): PublishPackage | undefined {
  if (result.status !== 'ok') return undefined;
  const all = result.groups.flatMap((group) => group.packages);
  return all.find((item) => item.badge) ?? all[0];
}

export function PublishView({ result }: { result: PackagesResult }) {
  const text = messages.publishing;
  const reference = referencePackage(result);
  const groups = result.status === 'ok' ? result.groups.filter((g) => g.packages.length > 0) : [];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{text.eyebrow}</span>
        <h1>{text.heading}</h1>
        <p>{text.intro}</p>
      </header>

      {result.status === 'error' ? (
        <div className={styles.message} role="alert">
          <p>{text.loadError}</p>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.message}>
          <p>{text.empty}</p>
        </div>
      ) : (
        groups.map((group) => (
          <section
            aria-labelledby={`section-${group.section.id}`}
            className={styles.block}
            key={group.section.id}
          >
            <div className={styles.sectionHead}>
              <h2 id={`section-${group.section.id}`}>{group.section.name}</h2>
              <p>
                {text.sectionDuration.replace('{months}', String(group.section.durationMonths))}
              </p>
            </div>
            <div className={group.packages.length >= 4 ? styles.grid4 : styles.grid3}>
              {group.packages.map((item) => (
                <PackageCard item={item} key={item.id} />
              ))}
            </div>
          </section>
        ))
      )}

      {reference && reference.authorBox.title ? (
        <section className={styles.block}>
          <div className={styles.authorBox}>
            <h2>{reference.authorBox.title}</h2>
            <p>{reference.authorBox.text}</p>
          </div>
        </section>
      ) : null}

      {reference && reference.steps.length > 0 ? (
        <section aria-labelledby="steps-heading" className={styles.block}>
          <div className={styles.sectionHead}>
            <h2 id="steps-heading">{text.stepsHeading}</h2>
          </div>
          <ol className={styles.steps}>
            {reference.steps.map((step, index) => (
              <li key={`${step.title}-${index}`}>
                <b>{step.title}</b>
                {step.description ? <span>{step.description}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {reference && reference.conditions.length > 0 ? (
        <section aria-labelledby="conditions-heading" className={styles.block}>
          <div className={styles.sectionHead}>
            <h2 id="conditions-heading">{text.conditionsHeading}</h2>
          </div>
          <ul className={styles.conditions}>
            {reference.conditions.map((condition, index) => (
              <li key={`${condition}-${index}`}>{condition}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.status === 'ok' && groups.length > 0 ? (
        <FeatureGate feature="manuscript-request" label={messages.site.soon} whenSoon="hide">
          <RequestForm groups={groups} />
        </FeatureGate>
      ) : null}
    </div>
  );
}
