import { notFound } from 'next/navigation';

// Proxy rewrites invalid segments here before the affected detail route can fetch data.
export default function InvalidSegmentPage() {
  notFound();
}
