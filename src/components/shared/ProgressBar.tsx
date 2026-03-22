interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ percent, color = 'var(--color-accent-secondary)', height = 8, showLabel = false }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height, backgroundColor: 'var(--color-bg-tertiary)' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)', minWidth: '2.5rem' }}>
          {percent}%
        </span>
      )}
    </div>
  );
}
