// atoms/FAB.tsx — Floating action button (bottom-right, purpose purple)
import { motion } from 'framer-motion';

interface FABProps {
  onClick: () => void;
  icon?: string;
  label?: string;
  className?: string;
}

export function FAB({ onClick, icon = '\u00B7', label = 'Captura rapida', className = '' }: FABProps) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      className={`fixed bottom-20 right-4 z-20 flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-bg font-mono text-2xl ${className}`}
      style={{ backgroundColor: '#c4a882' }}
    >
      {icon}
    </motion.button>
  );
}
