import { useState, type ReactNode } from 'react';

interface PanelItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface MobileLayoutProps {
  panels: PanelItem[];
  preview: ReactNode;
  initialOpenId?: string;
  error?: ReactNode;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 flex-none text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 6 8 10 12 6" />
    </svg>
  );
}

export function MobileLayout({ panels, preview, initialOpenId, error }: MobileLayoutProps) {
  const defaultId = initialOpenId ?? panels[0]?.id ?? '';
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set([defaultId]));

  const togglePanel = (id: string) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {panels.map((panel) => (
        <div key={panel.id} className="border-b border-border">
          <button
            type="button"
            onClick={() => togglePanel(panel.id)}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              {panel.label}
            </span>
            <Chevron open={openPanels.has(panel.id)} />
          </button>
          <div
            className={`px-4 pb-4 [&>section>h3]:hidden ${openPanels.has(panel.id) ? 'block' : 'hidden'}`}
          >
            {panel.content}
          </div>
        </div>
      ))}

      {error && (
        <div className="border-b border-border px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex-1">
        {preview}
      </div>
    </div>
  );
}
