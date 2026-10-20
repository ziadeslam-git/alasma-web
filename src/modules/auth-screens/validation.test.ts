import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/ar.json';

import { isSafeRedirectPath, validateLogin, validateRegister } from './validation';

const text = messages.auth;
const valid = {
  confirmPassword: 'Abcdefgh1x',
  email: 'reader@example.com',
  fullName: 'Test Reader',
  password: 'Abcdefgh1x',
  phone: '01012345678',
  terms: true,
};
const withPassword = (password: string) =>
  validateRegister({ ...valid, confirmPassword: password, password }, text).password;

describe('login validation', () => {
  it('requires both fields and a valid email', () => {
    expect(validateLogin({ email: '', password: '' }, text)).toEqual({
      email: text.required,
      password: text.required,
    });
    expect(validateLogin({ email: 'invalid', password: 'x' }, text).email).toBe(text.invalidEmail);
  });

  it('does not apply the new-password rules to an existing password', () => {
    expect(validateLogin({ email: 'a@b.co', password: 'short' }, text)).toEqual({
      email: undefined,
      password: undefined,
    });
  });
});

describe('register validation', () => {
  it('accepts a valid form', () => {
    expect(Object.values(validateRegister(valid, text)).filter(Boolean)).toEqual([]);
  });

  it('follows the API password rules: 10+ characters, lowercase, uppercase, digit, no symbol needed', () => {
    expect(withPassword('')).toBe(text.required);
    expect(withPassword('Abcdefgh1')).toBe(text.passwordTooShort);
    expect(withPassword('ABCDEFGHI1J')).toBe(text.passwordNeedsLower);
    expect(withPassword('abcdefghi1j')).toBe(text.passwordNeedsUpper);
    expect(withPassword('Abcdefghijk')).toBe(text.passwordNeedsDigit);
    expect(withPassword('Abcdefgh1x')).toBeUndefined();
    expect(withPassword(`Aa1${'x'.repeat(125)}`)).toBeUndefined();
    expect(withPassword(`Aa1${'x'.repeat(126)}`)).toBe(text.passwordTooLong);
  });

  it('requires the confirmation to match, on the client only', () => {
    expect(
      validateRegister({ ...valid, confirmPassword: 'Other1234567' }, text).confirmPassword,
    ).toBe(text.passwordMismatch);
  });

  it('checks the name length, the Egyptian mobile and the terms', () => {
    expect(validateRegister({ ...valid, fullName: ' a ' }, text).fullName).toBe(
      text.invalidFullName,
    );
    expect(validateRegister({ ...valid, fullName: '' }, text).fullName).toBe(text.required);
    expect(validateRegister({ ...valid, phone: '12345' }, text).phone).toBe(text.invalidPhone);
    expect(validateRegister({ ...valid, phone: '+20 101-234-5678' }, text).phone).toBeUndefined();
    expect(validateRegister({ ...valid, terms: false }, text).terms).toBe(text.required);
  });
});

describe('isSafeRedirectPath', () => {
  it.each(['/books', '/books?page=2', '/account/orders'])('accepts %s', (path) => {
    expect(isSafeRedirectPath(path)).toBe(true);
  });

  it.each([
    null,
    '',
    'books',
    '//evil.com',
    'https://evil.com',
    '/\\evil',
    'javascript:alert(1)',
    '/%2fevil.com',
    '/a\nb',
  ])('rejects %j', (path) => {
    expect(isSafeRedirectPath(path)).toBe(false);
  });
});
