import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckoutPageDev } from '@/modules/checkout';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function DevCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { state = 'ok' } = await searchParams;
  return (
    <main id="main-content">
      <CheckoutPageDev state={state} />
    </main>
  );
}
