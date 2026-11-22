import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import messages from '@/i18n/messages/ar.json';
import { FeatureFlagsProvider, resolveFeatureFlags } from '@/shared/config/feature-flags';
import { ApiError } from '@/shared/lib/api';
import { axe } from '@/test/axe';

import { makeGroups } from '../test/fixtures';
import { selectPackage } from '../state/package-selection';
import { PublishView } from './publish-view';

const mocks = vi.hoisted(() => ({
  status: 'authenticated',
  types: vi.fn(),
  submit: vi.fn(),
}));

vi.mock('@/modules/auth', () => ({
  useAuth: () => ({ status: mocks.status, user: { email: 'reader@example.com' } }),
}));
vi.mock('@/modules/account', () => ({ UnconfirmedEmailBanner: () => <p>unconfirmed</p> }));
vi.mock('../api/publishing-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/publishing-api')>()),
  getManuscriptTypes: mocks.types,
  submitPackageRequest: mocks.submit,
}));

const text = messages.publishing;
const form = text.form;

async function fillValid(
  file = new File(['x'], 'book.pdf', { type: 'application/pdf' }),
  applyAccept = true,
) {
  await userEvent.type(screen.getByLabelText(form.fullName), 'اسم المؤلف');
  await userEvent.type(screen.getByLabelText(form.phone), '01012345678');
  await userEvent.selectOptions(screen.getByLabelText(form.package), '2');
  await screen.findByRole('option', { name: 'نوع' });
  await userEvent.selectOptions(screen.getByLabelText(form.type), '7');
  await userEvent.type(screen.getByLabelText(form.workTitle), 'عنوان');
  await userEvent.type(screen.getByLabelText(form.synopsis), 'نبذة');
  await userEvent
    .setup({ applyAccept })
    .upload(screen.getByLabelText(form.file, { selector: 'input' }), file);
}

describe('PublishView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectPackage(null);
    mocks.status = 'authenticated';
    mocks.types.mockResolvedValue([{ id: 7, name: 'نوع', order: 1 }]);
    mocks.submit.mockResolvedValue({ id: 1, status: 'New' });
  });

  it('shows the sections, the packages, the API price or its note, the badge and the shared blocks', async () => {
    const { container } = render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);

    expect(screen.getByRole('heading', { level: 1, name: text.heading })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'One year' })).toBeInTheDocument();
    expect(screen.getByText(text.sectionDuration.replace('{months}', '36'))).toBeInTheDocument();
    expect(screen.getAllByText('5,000')).toHaveLength(2);
    expect(screen.getAllByText(messages.catalog.currency).length).toBeGreaterThan(0);
    expect(screen.getByText('Depends on project')).toBeInTheDocument();
    expect(screen.getByText('Most requested')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Request now' })[0]).toHaveAttribute('href', '#req');
    // the highlighted package (the one with a badge) supplies the steps, the conditions and the author box
    expect(screen.getByText('Step one')).toBeInTheDocument();
    expect(screen.getByText('Condition one')).toBeInTheDocument();
    expect(screen.getByText('Author box')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows a message when the packages cannot be read, or when there are none, and no form', () => {
    const { rerender } = render(<PublishView result={{ status: 'error' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent(text.loadError);
    expect(screen.queryByRole('heading', { name: form.title })).toBeNull();

    rerender(<PublishView result={{ status: 'ok', groups: [] }} />);
    expect(screen.getByText(text.empty)).toBeInTheDocument();
  });

  it('leaves the request form out while its feature is soon', () => {
    render(
      <FeatureFlagsProvider value={{ ...resolveFeatureFlags(null), 'manuscript-request': 'soon' }}>
        <PublishView result={{ status: 'ok', groups: makeGroups() }} />
      </FeatureFlagsProvider>,
    );

    expect(screen.queryByRole('heading', { name: form.title })).toBeNull();
  });

  it('sends a visitor to sign in with the return URL instead of showing the form', () => {
    mocks.status = 'anonymous';
    render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);

    expect(screen.getByRole('link', { name: form.login })).toHaveAttribute(
      'href',
      `/login?next=${encodeURIComponent('/publish#req')}`,
    );
    expect(screen.queryByLabelText(form.fullName)).toBeNull();
    expect(mocks.types).not.toHaveBeenCalled();
  });

  it('pre-selects the package chosen on a card and shows the account email read-only', async () => {
    const { container } = render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);
    await userEvent.click(screen.getAllByRole('link', { name: 'Request now' })[2]!);

    expect(screen.getByLabelText(form.package)).toHaveValue('3');
    expect(screen.getByLabelText(form.email)).toHaveValue('reader@example.com');
    expect(screen.getByLabelText(form.email)).toHaveAttribute('readonly');
    await screen.findByRole('option', { name: 'نوع' });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows every validation message and sends nothing for an empty form', async () => {
    render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);

    await userEvent.click(screen.getByRole('button', { name: form.submit }));

    for (const key of [
      'nameRequired',
      'phoneInvalid',
      'packageRequired',
      'typeRequired',
      'workTitleRequired',
      'synopsisRequired',
      'fileRequired',
    ] as const) {
      expect(screen.getByText(messages.publishing.errors[key])).toBeInTheDocument();
    }
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it('refuses a wrong file type before sending', async () => {
    render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);
    await fillValid(new File(['x'], 'cover.png', { type: 'image/png' }), false);

    await userEvent.click(screen.getByRole('button', { name: form.submit }));

    expect(await screen.findByText(messages.publishing.errors.fileType)).toBeInTheDocument();
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it('submits the fields, shows an upload state without a second submit, then the success message', async () => {
    let finish: () => void = () => undefined;
    mocks.submit.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);
    await fillValid();

    await userEvent.click(screen.getByRole('button', { name: form.submit }));
    const busy = await screen.findByRole('button', { name: form.submitting });
    expect(busy).toBeDisabled();
    await userEvent.click(busy);
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect(mocks.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        packageId: 2,
        manuscriptTypeId: 7,
        authorName: 'اسم المؤلف',
        phone: '01012345678',
        workTitle: 'عنوان',
        synopsis: 'نبذة',
      }),
    );

    finish();
    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(screen.getByText(form.successText)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: form.sendAnother }));
    expect(screen.getByLabelText(form.fullName)).toHaveValue('');
  });

  it.each([
    ['manuscript_file_invalid', 400],
    ['package_not_available', 422],
    ['manuscript_type_not_available', 422],
  ])('shows the Arabic message for %s and keeps the form', async (code, status) => {
    mocks.submit.mockRejectedValue(new ApiError({ kind: 'problem', status, code }));
    render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);
    await fillValid();

    await userEvent.click(screen.getByRole('button', { name: form.submit }));

    const key = code as keyof typeof messages.apiErrors.codes;
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(messages.apiErrors.codes[key]),
    );
    expect(screen.queryByText(form.successTitle)).toBeNull();
    expect(screen.getByLabelText(form.fullName)).toHaveValue('اسم المؤلف');
  });

  it('adds the wait time on a 429 and shows the confirmation banner for an unconfirmed email', async () => {
    mocks.submit.mockRejectedValueOnce(
      new ApiError({ kind: 'problem', status: 429, retryAfterSeconds: 30 }),
    );
    mocks.submit.mockRejectedValueOnce(
      new ApiError({ kind: 'problem', status: 403, code: 'email_not_confirmed' }),
    );
    render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);
    await fillValid();

    await userEvent.click(screen.getByRole('button', { name: form.submit }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(messages.apiErrors.status['429']);
    expect(alert).toHaveTextContent(form.retryAfter.replace('{seconds}', '30'));

    await userEvent.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText('unconfirmed')).toBeInTheDocument();
  });

  it('keeps the form usable and says so when the manuscript types cannot be read', async () => {
    mocks.types.mockRejectedValue(new ApiError({ kind: 'network' }));
    render(<PublishView result={{ status: 'ok', groups: makeGroups() }} />);

    expect(await screen.findByText(form.typesLoadError)).toBeInTheDocument();
    expect(within(screen.getByLabelText(form.type)).getAllByRole('option')).toHaveLength(1);
  });
});
