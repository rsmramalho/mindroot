// atoms/StageBadge.tsx — Stage number + geometry + color
import { STAGE_COLORS, STAGE_GEOMETRIES } from './tokens';

interface StageBadgeProps {
  stage: number;
  className?: string;
}

export function StageBadge({ stage, className = '' }: StageBadgeProps) {
  const color = STAGE_COLORS[stage] ?? '#8a8a8a';
  const geometry = STAGE_GEOMETRIES[stage] ?? '?';

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono leading-tight ${className}`}
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span>{stage}</span>
      <span>{geometry}</span>
    </span>
  );
}
