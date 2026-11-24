import { getTranslations } from 'next-intl/server';

/**
 * Resolves UI labels from the Content SDK dictionary (loaded per site by src/i18n/request.ts,
 * where the messages are namespaced by site name).
 *
 * Every key needs a default, used when the dictionary item is missing in that language or
 * the dictionary can't be loaded, so a missing item never shows a raw key on the live site.
 * Dictionary keys must not contain "." (next-intl reads dots as nesting).
 */
export const getDictionaryLabels = async <K extends string>(
  site: string | undefined,
  defaults: Record<K, string>,
): Promise<Record<K, string>> => {
  if (!site) return { ...defaults };

  try {
    const t = await getTranslations(site);
    const labels = { ...defaults };
    for (const key of Object.keys(defaults) as K[]) {
      // Raw text: the patterns use simple {placeholders} that the components fill in themselves
      if (t.has(key)) labels[key] = String(t.raw(key) ?? '') || defaults[key];
    }
    return labels;
  } catch (error) {
    console.error('Dictionary: falling back to default labels', error);
    return { ...defaults };
  }
};
