import { notFound } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function ErrorTestPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  throw new Error('Development error test');
}
