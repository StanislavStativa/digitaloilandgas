import { cn, readCheckbox } from '../../lib/utils';

describe('readCheckbox', () => {
  it.each([
    [true, true],
    ['1', true],
    ['true', true],
    [' TRUE ', true],
    [1, true],
    [false, false],
    ['', false],
    ['0', false],
    ['false', false],
    [0, false],
  ])('%p → %p', (value, expected) => {
    expect(readCheckbox(value, !expected)).toBe(expected);
  });

  it('uses the fallback only for a missing value', () => {
    expect(readCheckbox(undefined, true)).toBe(true);
    expect(readCheckbox(null, true)).toBe(true);
    expect(readCheckbox(undefined)).toBe(false);
  });
});

describe('cn', () => {
  it('joins truthy parts and collapses whitespace', () => {
    expect(cn('component', false, undefined, null, '  col-6   custom ', 'is-editing')).toBe('component col-6 custom is-editing');
  });

  it('returns an empty string when nothing is set', () => {
    expect(cn(undefined, false, '')).toBe('');
  });
});
