import { useLocale } from '../../../hooks/useLocale';
import type { Locale } from '../../../i18n';

export function AppShell() {
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-primary">{t('app.title')}</h1>
          <p className="text-sm text-text-muted">{t('app.tagline')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-dim">{t('language.label')}</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded border border-border bg-surface-alt px-2 py-1 text-sm text-text"
          >
            <option value="en">{t('language.en')}</option>
            <option value="es">{t('language.es')}</option>
          </select>
        </div>
      </header>

      <main className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-4 text-6xl">🎸</div>
          <h2 className="mb-2 text-2xl font-bold">{t('app.title')}</h2>
          <p className="text-text-muted">
            Scaffold ready. Start building modules.
          </p>
          <div className="mt-8 rounded-lg border border-border bg-surface-alt p-6 text-left text-sm">
            <p className="mb-2 font-mono text-primary">Next steps:</p>
            <ul className="space-y-1 text-text-muted">
              <li>→ Implement calculator/engine.ts</li>
              <li>→ Build FretboardSVG renderer</li>
              <li>→ Create input panels</li>
              <li>→ Wire up useFretboard hook</li>
              <li>→ Add export functionality</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
