import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import messages from '@/i18n/messages/ar.json';
import { HomeView } from '@/modules/home';

import { buildDevHomeData, parseDevHomeState, type DevHomeState } from './home-fixtures';
import styles from './home.module.css';

export const metadata: Metadata = {
  title: 'Home (dev)',
  robots: { index: false, follow: false },
};

const BASE_PATH = '/dev/home';

const presets: ReadonlyArray<{ key: DevHomeState; href: string }> = [
  { key: 'ok', href: BASE_PATH },
  { key: 'partial', href: `${BASE_PATH}?state=partial` },
  { key: 'empty', href: `${BASE_PATH}?state=empty` },
  { key: 'error', href: `${BASE_PATH}?state=error` },
];

type DevHomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

// Development reference page for the Home page (ok, partial, empty and error states). Returns 404 in production.
export default async function DevHomePage({ searchParams }: DevHomePageProps = {}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const state = parseDevHomeState(resolvedParams.state);
  const data = buildDevHomeData(state);
  const text = messages.devHome;

  return (
    <main className={styles.page} id="main-content">
      <nav aria-label={text.presetsLabel} className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <span className={styles.toolbarTitle}>{text.title}</span>
          <ul className={styles.presetList}>
            {presets.map((preset) => (
              <li key={preset.key}>
                <Link
                  aria-current={state === preset.key ? 'page' : undefined}
                  className={styles.presetLink}
                  href={preset.href}
                >
                  {text.presets[preset.key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <HomeView data={data} />
    </main>
  );
}
