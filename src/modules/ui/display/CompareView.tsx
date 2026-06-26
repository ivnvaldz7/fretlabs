/**
 * CompareView — renders two FretboardSVG instances side-by-side
 * for comparing the live (editable) design against a frozen reference.
 */

import { FretboardSVG } from '../../renderer/FretboardSVG';
import type { FretboardResult } from '../../calculator/types';
import type { Unit } from '../../../config/constants';
import type { FretboardDisplayOptions } from '../../renderer/types';
import { useLocale } from '../../../hooks/useLocale';

interface CompareViewProps {
  liveResult: FretboardResult;
  referenceResult: FretboardResult;
  unit: Unit;
  displayOptions: FretboardDisplayOptions;
}

export function CompareView({
  liveResult,
  referenceResult,
  unit,
  displayOptions,
}: CompareViewProps) {
  const { t } = useLocale();

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 md:flex-row">
      {/* Live design */}
      <div className="flex flex-1 flex-col">
        <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {t('compare.live')}
        </span>
        <div className="flex min-h-0 flex-1 rounded-lg border border-border bg-surface p-2">
          <FretboardSVG
            result={liveResult}
            options={displayOptions}
            unit={unit}
            className="h-full w-full"
          />
        </div>
      </div>

      {/* Reference design */}
      <div className="flex flex-1 flex-col">
        <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
          {t('compare.reference')}
        </span>
        <div className="flex min-h-0 flex-1 rounded-lg border border-border bg-surface p-2">
          <FretboardSVG
            result={referenceResult}
            options={displayOptions}
            unit={unit}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
