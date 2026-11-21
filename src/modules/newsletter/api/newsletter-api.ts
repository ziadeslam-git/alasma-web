import { getApiClient } from '@/modules/auth';

// POST /newsletter/subscribe answers 202 for every well-formed address (new, already subscribed, or gone), so the
// caller can never learn whether an address was known. 400 is a malformed address; 429 is 5 requests per hour per IP.
export async function subscribeToNewsletter(email: string): Promise<void> {
  await getApiClient().POST('/api/v1/newsletter/subscribe', { body: { email } });
}
