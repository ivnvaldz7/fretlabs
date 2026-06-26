import { useId } from 'react';
import { useLocale } from '../../../hooks/useLocale';
import { SCALE_PRESETS, type ScalePreset } from '../../../config/scale-presets';
import { HelpTip } from '../display/HelpTip';

interface ScalePresetSelectorProps {
  onSelect: (preset: ScalePreset) => void;
}

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  'equal-temperament': 'panel.scalePreset.category.equal',
  'just-intonation': 'panel.scalePreset.category.just',
  'historical': 'panel.scalePreset.category.historical',
  'microtonal': 'panel.scalePreset.category.microtonal',
};

export function ScalePresetSelector({ onSelect }: ScalePresetSelectorProps) {
  const { t } = useLocale();
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = SCALE_PRESETS.find((p) => p.id === e.target.value);
    if (preset) {
      onSelect(preset);
      e.target.value = '';
    }
  };

  const categories = [...new Set(SCALE_PRESETS.map((p) => p.category))];

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text-dim flex items-center gap-1.5">
        {t('panel.scalePreset.label')}
        <HelpTip text={t('help.scalePreset')} />
      </label>
      <select
        id={id}
        onChange={handleChange}
        defaultValue=""
        className="w-full rounded border border-border bg-surface-alt px-3 py-1.5 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      >
        <option value="" disabled>
          {t('panel.scalePreset.placeholder')}
        </option>
        {categories.map((cat) => (
          <optgroup key={cat} label={t(CATEGORY_LABEL_KEYS[cat])}>
            {SCALE_PRESETS.filter((p) => p.category === cat).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
