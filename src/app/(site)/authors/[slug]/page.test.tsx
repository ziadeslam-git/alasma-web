import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  getAuthor: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/modules/authors', () => ({
  getAuthor: mocks.getAuthor,
  getAuthorBooks: vi.fn(),
  AuthorView: () => null,
}));
import AuthorPage from './page';
describe('author route', () => {
  beforeEach(() => {
    mocks.getAuthor.mockReset();
    mocks.notFound.mockClear();
  });
  it('rejects an overlong slug before fetching', async () => {
    await expect(
      AuthorPage({ params: Promise.resolve({ slug: 'a'.repeat(201) }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.getAuthor).not.toHaveBeenCalled();
  });
  it('maps a missing author to notFound', async () => {
    mocks.getAuthor.mockResolvedValue(null);
    await expect(AuthorPage({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });
  it('propagates server errors', async () => {
    mocks.getAuthor.mockRejectedValue(new Error('server'));
    await expect(AuthorPage({ params: Promise.resolve({ slug: 'error' }) })).rejects.toThrow(
      'server',
    );
  });
});
