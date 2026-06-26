interface WarningBadgeProps {
  message: string;
}

export function WarningBadge({ message }: WarningBadgeProps) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
      <span className="mt-0.5 shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
