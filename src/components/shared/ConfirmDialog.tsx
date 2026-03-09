// components/shared/ConfirmDialog.tsx
// Mini-dialog de confirmação para ações destrutivas
// Overlay escuro + card centralizado

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmColor = '#e85d5d',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // Focus confirm button when dialog opens
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            className="relative rounded-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={description ? 'confirm-dialog-desc' : undefined}
            style={{
              backgroundColor: '#1a1d24',
              border: '1px solid #a8947820',
              padding: '24px',
              maxWidth: '320px',
              width: '90%',
            }}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <h3
              id="confirm-dialog-title"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '18px',
                fontWeight: 400,
                color: '#e8e0d4',
                marginBottom: description ? '8px' : '20px',
              }}
            >
              {title}
            </h3>

            {description && (
              <p
                id="confirm-dialog-desc"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#a8947880',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                }}
              >
                {description}
              </p>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={onCancel}
                className="transition-all duration-150"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#a8947860',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#a8947810',
                  border: '1px solid #a8947815',
                }}
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                className="transition-all duration-150"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#111318',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: confirmColor,
                  border: `1px solid ${confirmColor}`,
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
