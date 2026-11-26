'use client';

import messages from '@/i18n/messages/ar.json';
import { useAuth } from '@/modules/auth';
import { Skeleton } from '@/shared/ui/skeleton';
import { FeatureGate } from '@/shared/ui/soon';

import { ChangeEmailForm } from './change-email-form';
import { ChangePasswordForm } from './change-password-form';
import { DangerZone } from './danger-zone';
import { LogoutAllSection } from './logout-all-section';
import { ReadingPreferences } from './reading-preferences';
import { ProfileForm } from './profile-form';
import { ProfileSummary } from './profile-summary';
import styles from './profile.module.css';
import { UnconfirmedEmailBanner } from './unconfirmed-email-banner';

// /account/profile: edit the profile, change the email, change the password, sign out everywhere.
export function ProfileEditView() {
  const { user } = useAuth();

  if (!user) {
    return <Skeleton shape="card" />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>{messages.account.editProfile}</h1>
        <p className={styles.intro}>{messages.account.profileDescription}</p>
      </div>
      {!user.emailConfirmed ? <UnconfirmedEmailBanner /> : null}
      <ProfileSummary user={user} />
      <ProfileForm />
      <FeatureGate feature="email-change" label={messages.site.soon} whenSoon="hide">
        <ChangeEmailForm />
      </FeatureGate>
      <ChangePasswordForm />
      <LogoutAllSection />
      <ReadingPreferences />
      <DangerZone />
    </div>
  );
}
