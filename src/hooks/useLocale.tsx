import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getTranslation, interpolate, type Locale } from '../i18n';
import { DEFAULTS } from '../config/constants';

interface LocaleContextValue {
  /** Current active locale */
  locale: Locale;
  /** Switch locale */
  setLocale: (locale: Locale) => void;
  /** Get translated string by key. Example: t('panel.scaleLength.label') */
  t: (key: string, values?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = 'fretlabs-locale';

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // localStorage might not be available
  }
  // Detect browser language
  const browserLang = navigator.language.slice(0, 2);
  return browserLang === 'es' ? 'es' : (DEFAULTS.LOCALE as Locale);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Silently fail if localStorage is not available
    }
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      const translated = getTranslation(locale, key);
      return values ? interpolate(translated, values) : translated;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
