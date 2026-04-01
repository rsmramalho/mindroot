// atoms/TypeChip.tsx — Pill badge with type name + color
import type { AtomType } from '@/types/item';
import { getTypeColor } from './tokens';

interface TypeChipProps {
  type: AtomType;
  className?: string;
}

export function TypeChip({ type, className = '' }: TypeChipProps) {
  const color = getTypeColor(type);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-sans font-medium leading-tight ${className}`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {type}
    </span>
  );
}
