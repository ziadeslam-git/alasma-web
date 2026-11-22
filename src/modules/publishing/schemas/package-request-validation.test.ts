import { describe, expect, it } from 'vitest';

import {
  MANUSCRIPT_MAX_BYTES,
  validatePackageRequest,
  type PackageRequestFields,
} from './package-request-validation';

const pdf = () => new File(['x'], 'book.pdf', { type: 'application/pdf' });

const valid = (): PackageRequestFields => ({
  authorName: 'اسم',
  phone: '01012345678',
  packageId: 1,
  manuscriptTypeId: 2,
  workTitle: 'عنوان',
  synopsis: 'نبذة',
  notes: '',
  file: pdf(),
});

describe('validatePackageRequest', () => {
  it('accepts a complete request', () => {
    expect(validatePackageRequest(valid())).toEqual({});
  });

  it('asks for every required field', () => {
    const issues = validatePackageRequest({
      authorName: ' ',
      phone: '',
      packageId: null,
      manuscriptTypeId: null,
      workTitle: '',
      synopsis: '',
      notes: '',
      file: null,
    });

    expect(issues).toEqual({
      authorName: 'nameRequired',
      phone: 'phoneInvalid',
      packageId: 'packageRequired',
      manuscriptTypeId: 'typeRequired',
      workTitle: 'workTitleRequired',
      synopsis: 'synopsisRequired',
      file: 'fileRequired',
    });
  });

  it.each([
    ['01012345678', true],
    ['+201012345678', true],
    ['0020 101 234 5678', true],
    ['010-1234-5678', true],
    ['01312345678', false],
    ['0101234567', false],
    ['abc', false],
  ])('checks the Egyptian mobile %s', (phone, isValid) => {
    const issues = validatePackageRequest({ ...valid(), phone });

    expect(issues.phone === undefined).toBe(isValid);
  });

  it('applies the text limits of the contract', () => {
    const issues = validatePackageRequest({
      ...valid(),
      authorName: 'ا'.repeat(151),
      workTitle: 'ا'.repeat(301),
      synopsis: 'ا'.repeat(2001),
      notes: 'ا'.repeat(1001),
    });

    expect(issues).toEqual({
      authorName: 'nameTooLong',
      workTitle: 'workTitleTooLong',
      synopsis: 'synopsisTooLong',
      notes: 'notesTooLong',
    });
  });

  it('accepts PDF and DOCX, and refuses an old DOC, an image, an empty file and a file over 25 MB', () => {
    const docx = new File(['x'], 'book.DOCX', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const noType = new File(['x'], 'book.pdf', { type: '' });
    const withFile = (file: File) => validatePackageRequest({ ...valid(), file }).file;

    expect(withFile(docx)).toBeUndefined();
    expect(withFile(noType)).toBeUndefined();
    expect(withFile(new File(['x'], 'book.doc', { type: 'application/msword' }))).toBe('fileType');
    expect(withFile(new File(['x'], 'cover.png', { type: 'image/png' }))).toBe('fileType');
    expect(withFile(new File([], 'book.pdf', { type: 'application/pdf' }))).toBe('fileEmpty');
    const big = new File(['x'], 'book.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: MANUSCRIPT_MAX_BYTES + 1 });
    expect(withFile(big)).toBe('fileSize');
  });
});
