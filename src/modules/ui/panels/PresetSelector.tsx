/**
 * PresetSelector — dropdown for loading common instrument presets.
 * Resets to placeholder after selection so the user can re-select the same preset.
 */

import { PRESETS, type InstrumentPreset } from '../../../config/presets';
import { useLocale } from '../../../hooks/useLocale';

const CATEGORIES = ['guitar', 'bass', 'other'] as const;

interface PresetSelectorProps {
  onSelect: (preset: InstrumentPreset) => void;
}

/**
 * Instrument preset dropdown.
 *
 * @param onSelect - Called with the selected preset when the user picks one
 */
export function PresetSelector({ onSelect }: PresetSelectorProps) {
  const { t } = useLocale();

  return (
    <section>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-dim">
        {t('panel.preset.label')}
      </label>
      <select
        defaultValue=""
        onChange={(e) => {
          const preset = PRESETS.find((p) => p.id === e.target.value);
          if (preset) {
            onSelect(preset);
            // Reset to placeholder so the user can re-select the same preset later
            e.target.value = '';
          }
        }}
        className="w-full rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none"
      >
        <option value="" disabled>
          {t('panel.preset.placeholder')}
        </option>
        {CATEGORIES.map((cat) => {
          const presets = PRESETS.filter((p) => p.category === cat);
          return (
            <optgroup key={cat} label={t(`panel.preset.category.${cat}`)}>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </section>
  );
}
