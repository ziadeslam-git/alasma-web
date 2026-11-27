import { notFound } from 'next/navigation';

// Every /admin/... path that has no page yet: the admin not-found screen (inside the frame).
export default function AdminUnknownPage() {
  notFound();
}
