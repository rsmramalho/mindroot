// atoms/ConfidenceBar.tsx — Horizontal confidence bar (green/yellow/red)

interface ConfidenceBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

function getConfidenceColor(value: number): string {
  if (value >= 80) return '#8a9e7a'; // green
  if (value >= 50) return '#c4a872'; // yellow
  return '#d4856a'; // red
}

export function ConfidenceBar({ value, className = '', showLabel = true }: ConfidenceBarProps) {
  const color = getConfidenceColor(value);
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-mono tabular-nums" style={{ color }}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
