// components/shared/NotificationPrompt.tsx — Soft permission request
// alpha.11: Non-intrusive prompt before browser permission dialog

import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationPrompt() {
  const {
    supported,
    enabled,
    permissionState,
    promptDismissed,
    enable,
    dismissPrompt,
  } = useNotifications();

  // Don't show if: not supported, already enabled, already denied, or dismissed
  const shouldShow =
    supported &&
    !enabled &&
    permissionState === 'default' &&
    !promptDismissed;

  if (!shouldShow) return null;

  const handleEnable = async () => {
    await enable();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="rounded-lg"
        style={{
          padding: '14px 16px',
          backgroundColor: '#c4a88208',
          border: '1px solid #c4a88218',
          marginBottom: '12px',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Bell icon (word-based, no emoji) */}
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: '#c4a882',
              backgroundColor: '#c4a88215',
              padding: '4px 6px',
              borderRadius: '6px',
              lineHeight: 1,
              flexShrink: 0,
              marginTop: '1px',
            }}
          >
            bell
          </span>

          <div className="flex-1 min-w-0">
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#e8e0d4',
                lineHeight: 1.4,
              }}
            >
              Receber lembretes?
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                color: '#a8947870',
                lineHeight: 1.4,
                marginTop: '2px',
              }}
            >
              Alertas de transicao de periodo e itens atrasados.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3" style={{ marginTop: '10px' }}>
              <button
                onClick={handleEnable}
                className="transition-all duration-150"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#111318',
                  backgroundColor: '#c4a882',
                  padding: '5px 14px',
                  borderRadius: '6px',
                }}
              >
                Ativar
              </button>
              <button
                onClick={dismissPrompt}
                className="transition-opacity hover:opacity-70"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#a8947860',
                }}
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
