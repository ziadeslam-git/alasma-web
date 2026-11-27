import { describe, expect, it } from 'vitest';

import { hasPermission, isStaff } from './permissions';

describe('hasPermission', () => {
  it('accepts a single permission the user has', () => {
    expect(hasPermission(['Books.Edit', 'Orders.View'], 'Books.Edit')).toBe(true);
  });

  it('rejects a single permission the user lacks', () => {
    expect(hasPermission(['Orders.View'], 'Books.Edit')).toBe(false);
  });

  it('accepts anyOf when one of the permissions is granted', () => {
    expect(hasPermission(['Orders.View'], { anyOf: ['Books.Edit', 'Orders.View'] })).toBe(true);
  });

  it('rejects anyOf when none is granted', () => {
    expect(hasPermission(['Users.View'], { anyOf: ['Books.Edit', 'Orders.View'] })).toBe(false);
  });

  it('grants nothing for an empty anyOf and for an empty permission list', () => {
    expect(hasPermission(['Books.Edit'], { anyOf: [] })).toBe(false);
    expect(hasPermission([], 'Books.Edit')).toBe(false);
  });

  it('does not match a permission by prefix or case', () => {
    expect(hasPermission(['Books.EditPrice'], 'Books.Edit')).toBe(false);
    expect(hasPermission(['books.edit'], 'Books.Edit')).toBe(false);
  });
});

describe('isStaff', () => {
  it('is false for a Customer only and for no role', () => {
    expect(isStaff(['Customer'])).toBe(false);
    expect(isStaff([])).toBe(false);
  });

  it('is true when any role other than Customer is present', () => {
    expect(isStaff(['Admin'])).toBe(true);
    expect(isStaff(['Customer', 'SuperAdmin'])).toBe(true);
  });
});
