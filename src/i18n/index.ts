import en from './en.json';
import es from './es.json';

export type Locale = 'en' | 'es';

const translations: Record<Locale, Record<string, unknown>> = { en, es };

/**
 * Get a nested translation value by dot-separated key.
 * Example: getTranslation('en', 'panel.scaleLength.label') → "Scale Length"
 */
export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.');
  let current: unknown = translations[locale];

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      // Fallback to English if key not found in current locale
      let fallback: unknown = translations.en;
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          return key; // Return key itself if not found anywhere
        }
      }
      return typeof fallback === 'string' ? fallback : key;
    }
  }

  return typeof current === 'string' ? current : key;
}

/**
 * Replace {placeholder} tokens in a translation string.
 * Example: interpolate("Value must be between {min} and {max}", { min: 0, max: 100 })
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in values ? String(values[key]) : `{${key}}`
  );
}
