import { getApiClient } from '@/modules/auth';
import { ApiError, type components } from '@/shared/lib/api';

export type UpdateProfileRequest = components['schemas']['UpdateMeCommand'];
export type ChangeEmailRequest = components['schemas']['RequestEmailChangeCommand'];
export type Profile = components['schemas']['MeResponse'];

// PUT /me: changes the name, the phone and the language. It answers the same body as GET /me. The email is NOT
// changed here (see requestEmailChange). Every failure is thrown as an ApiError by the client.
export async function updateProfile(body: UpdateProfileRequest): Promise<Profile> {
  const { data } = await getApiClient().PUT('/api/v1/me', { body });

  if (!data) {
    throw new ApiError({ kind: 'unknown', detail: 'The API returned no body.' });
  }

  return data;
}

// POST /me/email: the API answers 202 with an empty body whatever the new address is (free, taken or the current
// one), so the answer never says whether an address is registered. The email changes only after the link sent to the
// new address is opened. A wrong current password is 400 auth_current_password_invalid.
export async function requestEmailChange(body: ChangeEmailRequest): Promise<void> {
  await getApiClient().POST('/api/v1/me/email', { body });
}
