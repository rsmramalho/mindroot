// components/journal/ShareReflectionSheet.tsx — Bottom sheet for sharing a reflection
// Generates a public share link, copies to clipboard, allows revoking

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AtomItem } from '@/types/item';
import type { SharedReflectionData } from '@/types/share';
import { shareService } from '@/service/share-service';
import { useAppStore } from '@/store/app-store';

interface ShareReflectionSheetProps {
  item: AtomItem | null;
  onClose: () => void;
}

export default function ShareReflectionSheet({ item, onClose }: ShareReflectionSheetProps) {
  const user = useAppStore((s) => s.user);
  const [includeDate, setIncludeDate] = useState(true);
  const [includeModule, setIncludeModule] = useState(true);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check for existing share when opening
  useEffect(() => {
    if (!item || !user) return;
    let cancelled = false;

    shareService.getExistingShare(item.id, 'reflection', user.id).then((token) => {
      if (!cancelled && token) setShareToken(token);
    });

    return () => { cancelled = true; };
  }, [item, user]);

  // Reset state when closed
  useEffect(() => {
    if (!item) {
      setShareToken(null);
      setCopied(false);
      setLoading(false);
      setIncludeDate(true);
      setIncludeModule(true);
    }
  }, [item]);

  // Close on Escape
  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  const handleGenerate = async () => {
    if (!item || !user) return;
    setLoading(true);

    const contentData: SharedReflectionData = {
      title: item.title,
      description: item.notes || null,
      emotion_before: item.body.soul?.emotion_before || null,
      emotion_after: item.body.soul?.emotion_after || null,
      module: item.module,
      created_at: item.created_at,
      include_date: includeDate,
      include_module: includeModule,
    };

    try {
      const token = await shareService.generateShareToken(
        item.id,
        'reflection',
        contentData as unknown as Record<string, unknown>,
        user.id,
      );
      setShareToken(token);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!shareToken) return;
    setLoading(true);
    try {
      await shareService.revokeShare(shareToken);
      setShareToken(null);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative rounded-t-2xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Compartilhar reflexao"
            style={{
              backgroundColor: '#111318',
              border: '1px solid #a8947815',
              borderBottom: 'none',
              maxHeight: '70dvh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="rounded-full"
                style={{ width: 36, height: 4, backgroundColor: '#a8947830' }}
              />
            </div>

            {/* Header */}
            <div style={{ padding: '8px 20px 16px' }}>
              <h3
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '20px',
                  fontWeight: 400,
                  color: '#e8e0d4',
                }}
              >
                Compartilhar
              </h3>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#a8947860',
                }}
              >
                {item.title}
              </p>
            </div>

            <div className="flex flex-col gap-4" style={{ padding: '0 20px 32px' }}>
              {/* Toggles — only show before generating */}
              {!shareToken && (
                <div className="flex flex-col gap-3">
                  <ToggleRow
                    label="Incluir data"
                    checked={includeDate}
                    onChange={setIncludeDate}
                  />
                  <ToggleRow
                    label="Incluir modulo"
                    checked={includeModule}
                    onChange={setIncludeModule}
                  />
                </div>
              )}

              {/* Generate button */}
              {!shareToken && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#111318',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    backgroundColor: loading ? '#c4a88280' : '#c4a882',
                    border: '1px solid #c4a882',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Gerando...' : 'Gerar link'}
                </button>
              )}

              {/* Share URL display + copy */}
              {shareUrl && (
                <div className="flex flex-col gap-3">
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      backgroundColor: '#1a1d24',
                      border: '1px solid #a8947820',
                      padding: '10px 12px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '11px',
                        color: '#c4a882',
                        wordBreak: 'break-all',
                      }}
                    >
                      {shareUrl}
                    </span>
                  </div>

                  <button
                    onClick={handleCopy}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#111318',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      backgroundColor: copied ? '#8a9e7a' : '#c4a882',
                      border: `1px solid ${copied ? '#8a9e7a' : '#c4a882'}`,
                    }}
                  >
                    {copied ? 'Copiado!' : 'Copiar link'}
                  </button>

                  <button
                    onClick={handleRevoke}
                    disabled={loading}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: 400,
                      color: '#d4856a80',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#d4856a10',
                      border: '1px solid #d4856a15',
                    }}
                  >
                    Revogar link
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Toggle Row ────────────────────────────────────────

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: '#e8e0d4c0',
        }}
      >
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          backgroundColor: checked ? '#c4a88260' : '#a8947830',
          border: `1px solid ${checked ? '#c4a88240' : '#a8947820'}`,
          position: 'relative',
          transition: 'background-color 0.2s',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: checked ? '#c4a882' : '#a8947860',
            position: 'absolute',
            top: 2,
            left: checked ? 21 : 2,
            transition: 'left 0.2s',
          }}
        />
      </button>
    </label>
  );
}
