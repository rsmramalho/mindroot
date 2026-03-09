// components/shared/Toast.tsx — Toast notification stack
// Bottom-center, auto-dismiss, undo support, dark surface style

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/store/toast-store';
import type { Toast as ToastType } from '@/store/toast-store';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notificacoes"
      className="fixed z-50 flex flex-col-reverse items-center gap-2 pointer-events-none"
      style={{
        bottom: '80px', // above BottomNav
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '420px',
        padding: '0 16px',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastType }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [progress, setProgress] = useState(100);

  // Progress bar countdown
  useEffect(() => {
    if (toast.duration <= 0) return;

    const start = toast.createdAt;
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [toast.createdAt, toast.duration]);

  const handleUndo = () => {
    toast.undoAction?.();
    dismiss(toast.id);
  };

  const borderColor =
    toast.type === 'error'
      ? '#e85d5d30'
      : toast.type === 'info'
        ? '#6b9bd230'
        : '#8a9e7a30';

  const accentColor =
    toast.type === 'error'
      ? '#e85d5d'
      : toast.type === 'info'
        ? '#6b9bd2'
        : '#8a9e7a';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="pointer-events-auto w-full overflow-hidden"
      style={{
        backgroundColor: '#1a1d24',
        borderRadius: '10px',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center gap-3" style={{ padding: '12px 14px' }}>
        {/* Type indicator dot */}
        <div
          className="flex-shrink-0"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: accentColor,
          }}
        />

        {/* Message */}
        <span
          className="flex-1 min-w-0"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 400,
            color: '#e8e0d4',
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </span>

        {/* Undo button */}
        {toast.undoAction && (
          <button
            onClick={handleUndo}
            className="flex-shrink-0 transition-opacity hover:opacity-80"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              fontWeight: 500,
              color: '#c4a882',
              backgroundColor: '#c4a88215',
              border: '1px solid #c4a88220',
              borderRadius: '6px',
              padding: '4px 10px',
              letterSpacing: '0.02em',
            }}
          >
            {toast.undoLabel || 'Desfazer'}
          </button>
        )}

        {/* Dismiss button */}
        <button
          onClick={() => dismiss(toast.id)}
          aria-label="Fechar notificacao"
          className="flex-shrink-0 transition-opacity hover:opacity-80"
          style={{
            color: '#a8947850',
            fontSize: '14px',
            fontFamily: '"JetBrains Mono", monospace',
            lineHeight: 1,
            padding: '0 2px',
          }}
        >
          x
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div
          style={{
            height: 2,
            backgroundColor: '#a8947808',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: `${accentColor}40`,
              transition: 'width 100ms linear',
            }}
          />
        </div>
      )}
    </motion.div>
  );
}
