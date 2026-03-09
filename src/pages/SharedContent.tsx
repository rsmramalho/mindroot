// pages/SharedContent.tsx — Public shared content page
// Renders shared reflections and streaks without authentication
// Standalone layout: no AppShell, no nav

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { PublicShare, SharedReflectionData, SharedStreakData } from '@/types/share';
import { shareService } from '@/service/share-service';
import { LogoMark, LogoWordmark } from '@/components/shared/Logo';
import { EMOTION_STYLES } from '@/components/soul/EmotionPicker';

interface SharedContentPageProps {
  token: string;
}

export function SharedContentPage({ token }: SharedContentPageProps) {
  const [share, setShare] = useState<PublicShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    shareService
      .getSharedContent(token)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError(true);
        } else {
          setShare(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ backgroundColor: '#111318' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <LogoMark size={28} />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: '#c4a88260', animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ backgroundColor: '#111318' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center flex flex-col items-center gap-4"
        >
          <LogoMark size={24} />
          <p
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '20px',
              fontWeight: 300,
              color: '#e8e0d4',
            }}
          >
            Link expirado ou invalido
          </p>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#a8947860',
            }}
          >
            Este conteudo nao esta mais disponivel.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center"
      style={{ backgroundColor: '#111318', padding: '24px 16px' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full"
        style={{ maxWidth: 480 }}
      >
        {/* Content card */}
        <div
          className="rounded-2xl"
          style={{
            backgroundColor: '#1a1d24',
            border: '1px solid #a8947815',
            padding: '28px 24px',
          }}
        >
          {share.content_type === 'reflection' ? (
            <ReflectionView data={share.content_data as unknown as SharedReflectionData} />
          ) : (
            <StreakView data={share.content_data as unknown as SharedStreakData} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <LogoMark size={12} />
          <LogoWordmark size="sm" variant="duo" />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Reflection View ─────────────────────────────────────

function ReflectionView({ data }: { data: SharedReflectionData }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h1
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '24px',
          fontWeight: 400,
          color: '#e8e0d4',
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
        }}
      >
        {data.title}
      </h1>

      {/* Emotion dots */}
      {(data.emotion_before || data.emotion_after) && (
        <div className="flex items-center gap-2">
          {data.emotion_before && <SharedEmotionDot emotion={data.emotion_before} />}
          {data.emotion_before && data.emotion_after && (
            <span style={{ color: '#a8947830', fontSize: '10px' }}>→</span>
          )}
          {data.emotion_after && <SharedEmotionDot emotion={data.emotion_after} />}
        </div>
      )}

      {/* Description */}
      {data.description && (
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 300,
            color: '#e8e0d4c0',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.description}
        </p>
      )}

      {/* Date + Module */}
      <div
        className="flex items-center gap-3 pt-3"
        style={{ borderTop: '1px solid #a8947810' }}
      >
        {data.include_date && data.created_at && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '11px',
              color: '#a8947840',
            }}
          >
            {new Date(data.created_at).toLocaleDateString('pt-BR')}
          </span>
        )}
        {data.include_module && data.module && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              color: '#a8947850',
              backgroundColor: '#a8947810',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {data.module}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Streak View ─────────────────────────────────────────

function StreakView({ data }: { data: SharedStreakData }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Big streak number */}
      <span
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '64px',
          fontWeight: 300,
          color: '#c4a882',
          lineHeight: 1,
        }}
      >
        {data.current}
      </span>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#a89478',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        dias seguidos
      </span>

      {/* Longest record */}
      <div
        className="flex items-center gap-2 mt-2"
        style={{
          padding: '8px 16px',
          borderRadius: '10px',
          backgroundColor: '#a8947808',
          border: '1px solid #a8947810',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#a8947860',
          }}
        >
          Recorde:
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '14px',
            fontWeight: 500,
            color: '#e8e0d4',
          }}
        >
          {data.longest} dias
        </span>
      </div>
    </div>
  );
}

// ─── Shared Emotion Dot ──────────────────────────────────

function SharedEmotionDot({ emotion }: { emotion: string }) {
  const style = EMOTION_STYLES[emotion as keyof typeof EMOTION_STYLES];
  if (!style) return null;

  return (
    <div className="flex items-center gap-1">
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: style.color,
          opacity: 0.8,
        }}
      />
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: style.color,
          fontWeight: 500,
          opacity: 0.7,
        }}
      >
        {emotion}
      </span>
    </div>
  );
}
