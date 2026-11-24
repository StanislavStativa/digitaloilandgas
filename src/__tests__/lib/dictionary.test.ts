import { getTranslations } from 'next-intl/server';
import { getDictionaryLabels } from 'lib/dictionary';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn() }));

const translations = getTranslations as unknown as jest.Mock;
const defaults = { BlogReadingTime: '{minutes} min', BlogViewAll: 'View all' };

const withMessages = (messages: Record<string, unknown>) =>
  translations.mockResolvedValue({
    has: (key: string) => key in messages,
    raw: (key: string) => messages[key],
  });

describe('getDictionaryLabels', () => {
  it('reads the keys from the site namespace, keeping {placeholders} raw', async () => {
    withMessages({ BlogReadingTime: '{minutes} Min.', BlogViewAll: 'Alle anzeigen' });

    await expect(getDictionaryLabels('site', defaults)).resolves.toEqual({
      BlogReadingTime: '{minutes} Min.',
      BlogViewAll: 'Alle anzeigen',
    });
    expect(translations).toHaveBeenCalledWith('site');
  });

  it('falls back to the default for missing or empty entries', async () => {
    withMessages({ BlogViewAll: '' });
    await expect(getDictionaryLabels('site', defaults)).resolves.toEqual(defaults);
  });

  it('returns the defaults without a site, without loading the dictionary', async () => {
    await expect(getDictionaryLabels(undefined, defaults)).resolves.toEqual(defaults);
    expect(translations).not.toHaveBeenCalled();
  });

  it('logs and returns the defaults when the dictionary fails to load', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    translations.mockRejectedValue(new Error('no messages'));

    await expect(getDictionaryLabels('site', defaults)).resolves.toEqual(defaults);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
