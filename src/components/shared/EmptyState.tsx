// components/shared/EmptyState.tsx

import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  message?: string;       // alias for title
  submessage?: string;    // alias for description
}

export function EmptyState({
  icon,
  title,
  description,
  message,
  submessage,
}: EmptyStateProps) {
  const displayTitle = title || message || 'Nada aqui ainda';
  const displayDesc = description || submessage || 'Use o input acima para adicionar algo';

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-6 gap-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {icon && (
        <span className="text-2xl text-muted/30 mb-1">{icon}</span>
      )}
      <span className="font-serif text-xl font-light text-muted/30 tracking-tight">
        {displayTitle}
      </span>
      <span className="font-sans text-xs text-muted/20">
        {displayDesc}
      </span>
    </motion.div>
  );
}

export default EmptyState;
