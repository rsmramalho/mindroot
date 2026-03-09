// pages/Landing.tsx — Public landing page (pre-auth)
// Mobile-first, standalone (no AppShell)

import { motion } from 'framer-motion';
import { LogoFull } from '@/components/shared/Logo';

interface LandingPageProps {
  onLogin: () => void;
}

const BENEFITS = [
  {
    title: 'Clareza Emocional',
    description: 'Registre como voce se sente antes e depois de cada acao. Descubra padroes que transformam sua rotina.',
    example: 'Ex: Perceber que voce e 40% mais produtivo quando esta calmo',
    color: '#8a9e7a',
  },
  {
    title: 'Rituais com Proposito',
    description: 'Organize seu dia em Aurora, Zenite e Crepusculo. Cada periodo tem seu ritmo e intencao.',
    example: 'Ex: Aurora para intencoes, Zenite para foco, Crepusculo para reflexao',
    color: '#c4a882',
  },
  {
    title: 'Insights Profundos',
    description: 'Analise emocional, streaks, correlacoes e sugestoes inteligentes para evoluir com consciencia.',
    example: 'Ex: Suas tasks de Trabalho tem 3x mais chance de serem concluidas pela manha',
    color: '#d4856a',
  },
] as const;

// ─── App Mockup ─────────────────────────────────────────────
function AppMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      className="w-full max-w-[380px] mx-auto rounded-2xl overflow-hidden"
      style={{
        backgroundColor: '#1a1d24',
        border: '1px solid #2a2d3440',
        boxShadow: '0 8px 32px #00000040',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #2a2d3430' }}
      >
        <span
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '15px',
            fontWeight: 300,
            color: '#e8e0d4',
          }}
        >
          MindRoot
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            color: '#e8e0d490',
            backgroundColor: '#e8e0d410',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          Zenite
        </span>
      </div>

      {/* Soul pulse */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-full"
            style={{ width: 8, height: 8, backgroundColor: '#8a9e7a', opacity: 0.7 }}
          />
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              color: '#8a9e7a',
            }}
          >
            focado
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              color: '#a8947850',
              marginLeft: 'auto',
            }}
          >
            ha 2h
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-2 flex flex-col gap-2">
        <MockItem
          title="Revisar proposta do cliente"
          module="Trabalho"
          moduleColor="#8a9e7a"
          priorityColor="#c4a882"
        />
        <MockItem
          title="Treino funcional — 30min"
          module="Corpo"
          moduleColor="#b8c4a8"
          priorityColor="#a89478"
          completed
        />
        <MockItem
          title="Leitura: 20 paginas"
          module="Mente"
          moduleColor="#a89478"
          priorityColor="#8a9e7a"
        />
      </div>

      {/* Bottom fade */}
      <div
        style={{
          height: 32,
          background: 'linear-gradient(transparent, #1a1d24)',
        }}
      />
    </motion.div>
  );
}

function MockItem({
  title,
  module,
  moduleColor,
  priorityColor,
  completed = false,
}: {
  title: string;
  module: string;
  moduleColor: string;
  priorityColor: string;
  completed?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: '10px 12px',
        backgroundColor: '#11131808',
        borderRadius: '8px',
        border: '1px solid #a8947808',
      }}
    >
      {/* Checkbox */}
      <div
        className="shrink-0 rounded-full"
        style={{
          width: 18,
          height: 18,
          border: completed ? 'none' : '1.5px solid #a8947830',
          backgroundColor: completed ? '#8a9e7a30' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {completed && (
          <span style={{ fontSize: '10px', color: '#8a9e7a' }}>ok</span>
        )}
      </div>

      {/* Priority dot */}
      <span
        className="shrink-0 rounded-full"
        style={{ width: 6, height: 6, backgroundColor: priorityColor, opacity: 0.5 }}
      />

      {/* Title */}
      <span
        className="flex-1 min-w-0 truncate"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: 400,
          color: completed ? '#a8947840' : '#e8e0d4cc',
          textDecoration: completed ? 'line-through' : 'none',
        }}
      >
        {title}
      </span>

      {/* Module badge */}
      <span
        className="shrink-0"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          fontWeight: 500,
          color: moduleColor,
          backgroundColor: `${moduleColor}15`,
          padding: '2px 6px',
          borderRadius: '4px',
          border: `1px solid ${moduleColor}20`,
        }}
      >
        {module}
      </span>
    </div>
  );
}

// ─── Landing Page ───────────────────────────────────────────
export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ backgroundColor: '#111318' }}
    >
      {/* Hero */}
      <motion.section
        className="flex flex-col items-center px-6 pt-16 pb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <LogoFull
          iconSize={32}
          wordmarkSize="xl"
          variant="duo"
          layout="vertical"
        />

        <p
          className="mt-8 text-center max-w-sm"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '18px',
            fontWeight: 300,
            color: '#a89478',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
          }}
        >
          Emocao precede acao, reflexao fecha o ciclo
        </p>

        <p
          className="mt-4 text-center max-w-sm"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 300,
            color: '#a8947870',
            lineHeight: 1.65,
          }}
        >
          Um sistema que conecta como voce se sente ao que voce faz.
          Registre emocoes, organize rituais e descubra padroes que transformam sua rotina.
        </p>

        <button
          onClick={onLogin}
          className="mt-10 transition-all duration-200 hover:opacity-90"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            fontWeight: 500,
            color: '#111318',
            backgroundColor: '#c4a882',
            borderRadius: '10px',
            padding: '14px 40px',
            letterSpacing: '0.02em',
          }}
        >
          Comecar agora
        </button>
      </motion.section>

      {/* App Mockup */}
      <section className="px-6 py-8">
        <AppMockup />
      </section>

      {/* Benefits */}
      <section className="px-6 pb-16">
        <div className="max-w-sm mx-auto flex flex-col gap-4">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease: 'easeOut' }}
              className="rounded-xl"
              style={{
                backgroundColor: '#1a1d24',
                border: `1px solid ${benefit.color}20`,
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '18px',
                  fontWeight: 400,
                  color: benefit.color,
                  marginBottom: '8px',
                }}
              >
                {benefit.title}
              </h3>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#a8947890',
                  lineHeight: 1.55,
                }}
              >
                {benefit.description}
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: `${benefit.color}90`,
                  marginTop: '10px',
                  lineHeight: 1.5,
                }}
              >
                {benefit.example}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-8 flex flex-col items-center gap-4">
        <button
          onClick={onLogin}
          className="transition-colors hover:text-light"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#a89478',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Ja tem conta? Entrar
        </button>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            color: '#a8947830',
          }}
        >
          MindRoot v1.0.0
        </span>
      </footer>
    </div>
  );
}
