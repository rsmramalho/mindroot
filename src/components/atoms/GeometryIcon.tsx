// atoms/GeometryIcon.tsx — SVG geometry for Genesis stages 1-7
import { motion } from 'framer-motion';
import { STAGE_COLORS, STAGE_GEOMETRIES } from './tokens';

interface GeometryIconProps {
  stage: number;
  size?: number;
  animated?: boolean;
  className?: string;
}

export function GeometryIcon({ stage, size = 24, animated = false, className = '' }: GeometryIconProps) {
  const color = STAGE_COLORS[stage] ?? '#8a8a8a';
  const geometry = STAGE_GEOMETRIES[stage] ?? '?';

  const content = (
    <span
      className={`inline-flex items-center justify-center font-mono leading-none select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.7, color }}
      aria-label={`Stage ${stage}`}
    >
      {geometry}
    </span>
  );

  if (!animated) return content;

  return (
    <motion.span
      className={`inline-flex items-center justify-center font-mono leading-none select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.7, color }}
      aria-label={`Stage ${stage}`}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {geometry}
    </motion.span>
  );
}
