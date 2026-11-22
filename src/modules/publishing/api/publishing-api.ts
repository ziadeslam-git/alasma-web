import { getApiClient, getUploadApiClient } from '@/modules/auth';
import {
  createServerClient,
  nextFetch,
  throwIfError,
  type ServerClientOptions,
  type components,
} from '@/shared/lib/api';

export type PackageGroup = components['schemas']['PackageGroupDto'];
export type PublishPackage = components['schemas']['PackageDto'];
export type ManuscriptType = components['schemas']['ManuscriptTypeDto'];
export type PackageRequest = components['schemas']['MyPackageRequestDto'];
type PackageRequestBody = components['schemas']['PackageRequestForm'];

export const PACKAGES_REVALIDATE_SECONDS = 3600;
export const PACKAGES_CACHE_TAG = 'packages';

export type PackagesResult =
  { status: 'ok'; groups: readonly PackageGroup[] } | { status: 'error' };

// The active sections with their packages, read on the server for the (cached) page. A failure becomes a result the
// page can show as a message instead of breaking.
export async function getPackages(options: ServerClientOptions = {}): Promise<PackagesResult> {
  try {
    const result = await createServerClient(options).GET('/api/v1/packages', {
      ...nextFetch({ revalidate: PACKAGES_REVALIDATE_SECONDS, tags: [PACKAGES_CACHE_TAG] }),
    });
    if (result.error) throwIfError(result);
    return result.data ? { status: 'ok', groups: result.data } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export async function getManuscriptTypes(): Promise<readonly ManuscriptType[]> {
  const result = await getApiClient().GET('/api/v1/manuscript-types', { cache: 'no-store' });
  if (!result.data) throw new Error('Missing manuscript types response');
  return result.data;
}

// The multipart fields of the contract (PackageRequestForm). The contact email is not sent: the API takes the account's.
export const PACKAGE_REQUEST_FIELDS = {
  packageId: 'packageId',
  authorName: 'authorName',
  phone: 'phone',
  workTitle: 'workTitle',
  manuscriptTypeId: 'manuscriptTypeId',
  synopsis: 'synopsis',
  notes: 'notes',
  file: 'file',
} as const;

export type PackageRequestInput = {
  packageId: number;
  authorName: string;
  phone: string;
  workTitle: string;
  manuscriptTypeId: number;
  synopsis: string;
  notes: string;
  file: File;
};

export function buildPackageRequestForm(input: PackageRequestInput): FormData {
  const form = new FormData();
  form.append(PACKAGE_REQUEST_FIELDS.packageId, String(input.packageId));
  form.append(PACKAGE_REQUEST_FIELDS.authorName, input.authorName.trim());
  form.append(PACKAGE_REQUEST_FIELDS.phone, input.phone.trim());
  form.append(PACKAGE_REQUEST_FIELDS.workTitle, input.workTitle.trim());
  form.append(PACKAGE_REQUEST_FIELDS.manuscriptTypeId, String(input.manuscriptTypeId));
  form.append(PACKAGE_REQUEST_FIELDS.synopsis, input.synopsis.trim());
  const notes = input.notes.trim();
  if (notes) form.append(PACKAGE_REQUEST_FIELDS.notes, notes);
  form.append(PACKAGE_REQUEST_FIELDS.file, input.file);
  return form;
}

// Multipart through the upload client (60 s timeout). The API does not support an Idempotency-Key here, so none is
// sent; the form blocks a second submit while one is running. The typed body is only a placeholder: the real FormData
// goes in through the body serializer (the generated type describes the file as a string).
export async function submitPackageRequest(input: PackageRequestInput): Promise<PackageRequest> {
  const placeholder: PackageRequestBody = {};
  const result = await getUploadApiClient().POST('/api/v1/package-requests', {
    cache: 'no-store',
    body: placeholder,
    bodySerializer: () => buildPackageRequestForm(input),
  });
  if (!result.data) throw new Error('Missing package request response');
  return result.data;
}
