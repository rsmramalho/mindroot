// components/shared/EmptyState.tsx

import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  message?: string;       // alias for title
  submessage?: string;    // alias for description
  actionLabel?: string;
  onAction?: () => void;
  positive?: boolean;     // green-tinted for "all clear" states
}

export function EmptyState({
  icon,
  title,
  description,
  message,
  submessage,
  actionLabel,
  onAction,
  positive,
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
        <span className="text-2xl mb-1" style={{ color: positive ? '#8a9e7a40' : '#a8947830' }}>
          {icon}
        </span>
      )}
      <span
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '20px',
          fontWeight: 300,
          color: positive ? '#8a9e7a50' : '#a8947830',
          letterSpacing: '-0.01em',
        }}
      >
        {displayTitle}
      </span>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: positive ? '#8a9e7a30' : '#a8947820',
        }}
      >
        {displayDesc}
      </span>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 transition-all duration-200"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            color: '#c4a882',
            backgroundColor: '#c4a88210',
            border: '1px solid #c4a88225',
            borderRadius: '8px',
            padding: '10px 20px',
          }}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

export default EmptyState;
