import messages from '@/i18n/messages/ar.json';

import styles from './admin-landing.module.css';

// The empty frame of the first admin task: a title and nothing else. The real pages come with the next tasks.
export default function AdminHomePage() {
  return <h1 className={styles.title}>{messages.admin.shell.landingTitle}</h1>;
}
