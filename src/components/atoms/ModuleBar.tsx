// atoms/ModuleBar.tsx — Left border 4px with module color
import type { AtomModule } from '@/types/item';
import { MODULE_COLORS } from './tokens';

interface ModuleBarProps {
  module: AtomModule | null;
  children: React.ReactNode;
  className?: string;
}

export function ModuleBar({ module, children, className = '' }: ModuleBarProps) {
  const color = module ? MODULE_COLORS[module] : '#8a8a8a';

  return (
    <div
      className={`border-l-4 pl-3 ${className}`}
      style={{ borderLeftColor: color }}
    >
      {children}
    </div>
  );
}
