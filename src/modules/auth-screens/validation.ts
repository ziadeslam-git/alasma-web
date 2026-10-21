export type LoginValues = { email: string; password: string };
export type RegisterValues = LoginValues & {
  confirmPassword: string;
  fullName: string;
  phone: string;
  terms: boolean;
};
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

// The password rules of the API (Identity options in IdentityServiceCollectionExtensions + the register validator):
// at least PASSWORD_MIN_LENGTH characters, one lowercase, one uppercase, one digit, at most PASSWORD_MAX_LENGTH.
// No symbol is required. The login form never checks these: an older account may predate a rule change.
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
const FULL_NAME_MIN_LENGTH = 2;
const FULL_NAME_MAX_LENGTH = 150;
const EMAIL_MAX_LENGTH = 256;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// PhoneNumberNormalizer of the API: an Egyptian mobile (01 + 9 digits, or +20 / 0020 in front), spaces and dashes ignored
const phonePattern = /^(?:0|\+20|0020)1\d{9}$/;

type LoginMessages = { invalidEmail: string; required: string };
type RegisterMessages = LoginMessages & {
  emailTooLong: string;
  invalidFullName: string;
  invalidPhone: string;
  passwordMismatch: string;
  passwordNeedsDigit: string;
  passwordNeedsLower: string;
  passwordNeedsUpper: string;
  passwordTooLong: string;
  passwordTooShort: string;
};

function validateEmail(email: string, messages: LoginMessages) {
  if (!email) {
    return messages.required;
  }

  return emailPattern.test(email) ? undefined : messages.invalidEmail;
}

function validateNewPassword(password: string, messages: RegisterMessages) {
  if (!password) {
    return messages.required;
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return messages.passwordTooShort;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return messages.passwordTooLong;
  }

  if (!/\p{Ll}/u.test(password)) {
    return messages.passwordNeedsLower;
  }

  if (!/\p{Lu}/u.test(password)) {
    return messages.passwordNeedsUpper;
  }

  return /[0-9]/.test(password) ? undefined : messages.passwordNeedsDigit;
}

export function validateLogin(
  values: LoginValues,
  messages: LoginMessages,
): ValidationErrors<LoginValues> {
  return {
    email: validateEmail(values.email, messages),
    password: values.password ? undefined : messages.required,
  };
}

export function validateRegister(
  values: RegisterValues,
  messages: RegisterMessages,
): ValidationErrors<RegisterValues> {
  const fullName = values.fullName.trim();
  const phone = values.phone.replace(/[\s-]/g, '');
  const emailError = validateEmail(values.email, messages);

  return {
    confirmPassword:
      values.confirmPassword === values.password ? undefined : messages.passwordMismatch,
    email:
      emailError ?? (values.email.length > EMAIL_MAX_LENGTH ? messages.emailTooLong : undefined),
    fullName: !fullName
      ? messages.required
      : fullName.length < FULL_NAME_MIN_LENGTH || fullName.length > FULL_NAME_MAX_LENGTH
        ? messages.invalidFullName
        : undefined,
    password: validateNewPassword(values.password, messages),
    phone: !phone
      ? messages.required
      : phonePattern.test(phone)
        ? undefined
        : messages.invalidPhone,
    terms: values.terms ? undefined : messages.required,
  };
}

export type ForgotValues = { email: string };
export type ResetValues = { confirmPassword: string; password: string };

export function validateForgotPassword(
  values: ForgotValues,
  messages: LoginMessages,
): ValidationErrors<ForgotValues> {
  return { email: validateEmail(values.email.trim(), messages) };
}

// Same password rules as the register form (validateNewPassword); the confirmation is checked here only.
export function validateResetPassword(
  values: ResetValues,
  messages: RegisterMessages,
): ValidationErrors<ResetValues> {
  return {
    confirmPassword:
      values.confirmPassword === values.password ? undefined : messages.passwordMismatch,
    password: validateNewPassword(values.password, messages),
  };
}

// Only same-site paths are followed after login: "//host", "/\host", absolute URLs and javascript: values are not.
export function isSafeRedirectPath(path: string | null | undefined): path is string {
  return Boolean(
    path &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.startsWith('/\\') &&
    !/%2f|%5c/i.test(path) &&
    !/[\u0000-\u001f]/.test(path),
  );
}
