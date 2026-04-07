import { useId } from 'react';

/**
 * HelpTip — lightweight tooltip for parameter explanations.
 *
 * Designed to work without dependencies:
 * - Desktop: hover
 * - Keyboard + mobile: focus (tap focuses the button)
 */
export function HelpTip({
  text,
  align = 'left',
}: {
  text: string;
  align?: 'left' | 'right';
}) {
  const id = useId();

  const tooltipAlign = align === 'right' ? 'right-0' : 'left-0';

  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="Help"
        aria-describedby={id}
        className="inline-flex h-4 w-4 items-center justify-center rounded border border-border bg-surface-alt text-[10px] font-semibold leading-none text-text-muted transition-colors hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute ${tooltipAlign} top-full z-50 mt-1 hidden w-64 rounded border border-border bg-surface-elevated px-2 py-1.5 text-xs leading-snug text-text shadow-lg group-hover:block group-focus-within:block`}
      >
        {text}
      </span>
    </span>
  );
}

