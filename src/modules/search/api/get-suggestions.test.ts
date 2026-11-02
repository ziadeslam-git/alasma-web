import { describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('@/modules/auth', () => ({ getApiClient: () => ({ GET: request }) }));
import { getSuggestions } from './get-suggestions';

describe('getSuggestions', () => {
  it('uses the supplied abort signal and caps the results', async () => {
    const signal = new AbortController().signal;
    request.mockResolvedValueOnce({
      data: Array.from({ length: 10 }, (_, index) => ({
        slug: String(index),
        title: String(index),
        coverImageUrl: null,
      })),
    });
    expect(await getSuggestions('book', signal)).toHaveLength(8);
    expect(request).toHaveBeenCalledWith('/api/v1/search/suggest', {
      params: { query: { q: 'book' } },
      signal,
    });
  });
  it('propagates request failures', async () => {
    request.mockRejectedValueOnce(new Error('network'));
    await expect(getSuggestions('book', new AbortController().signal)).rejects.toThrow('network');
  });
});
