import styles from './form.module.css';

// The error of a whole form (a rule the API refused, a server failure, a field the form does not have). Nothing when
// there is none.
export function FormBanner({ message }: { message: string | null }) {
  if (message === null) return null;

  return (
    <p className={styles.banner} role="alert">
      {message}
    </p>
  );
}
