import { beforeEach, describe, expect, it, vi } from 'vitest';
import CmsPage, { generateMetadata } from './page';

const mocks = vi.hoisted(() => ({
  getPage: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/modules/pages', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/pages')>();
  return { ...actual, getPage: mocks.getPage };
});

describe('CMS route', () => {
  beforeEach(() => vi.clearAllMocks());
  it('rejects an invalid key before a request', async () => {
    await expect(CmsPage({ params: Promise.resolve({ key: 'About' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mocks.getPage).not.toHaveBeenCalled();
  });
  it('calls notFound for an API 400 or 404 mapped result', async () => {
    mocks.getPage.mockResolvedValue({ kind: 'notFound' });
    await expect(CmsPage({ params: Promise.resolve({ key: 'about' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });
  it('propagates server errors', async () => {
    mocks.getPage.mockRejectedValue(new Error('Server error'));
    await expect(CmsPage({ params: Promise.resolve({ key: 'about' }) })).rejects.toThrow(
      'Server error',
    );
  });
  it('builds metadata with API title and canonical URL', async () => {
    mocks.getPage.mockResolvedValue({
      kind: 'ok',
      page: { key: 'about', title: 'عن الدار', body: 'نص', updatedAt: '2026-11-03T00:00:00Z' },
    });
    const meta = await generateMetadata({ params: Promise.resolve({ key: 'about' }) });
    expect(meta.title).toBe('عن الدار');
    expect(meta.alternates?.canonical).toContain('/pages/about');
  });
});
