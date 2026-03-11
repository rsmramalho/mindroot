// pages/Landing.tsx — Public landing page (pre-auth)
// alpha.25: editorial luxury redesign

import { motion } from 'framer-motion';
import { LogoMark } from '@/components/shared/Logo';

interface LandingPageProps {
  onLogin: () => void;
}

function BackgroundOrb() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #c4a88212 0%, #8a9e7a08 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}

function PeriodRow({
  name, time, description, color, index,
}: {
  name: string; time: string; description: string; color: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '24px',
        padding: '24px 0',
        borderTop: '1px solid #a8947812',
      }}
    >
      <div style={{ width: 4, height: 40, borderRadius: 2, backgroundColor: color, opacity: 0.6, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '20px', fontWeight: 400, color: color, letterSpacing: '0.01em' }}>
            {name}
          </span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: '#a8947850', letterSpacing: '0.05em' }}>
            {time}
          </span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 300, color: '#a8947878', lineHeight: 1.6, margin: 0 }}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}

const PERIODS = [
  { name: 'Aurora', time: '05h — 12h', description: 'Intencao e clareza. O momento de definir o que importa antes que o mundo defina por voce.', color: '#f0c674' },
  { name: 'Zenite', time: '12h — 18h', description: 'Acao e presenca. Pico de energia, foco profundo, execucao sem ruido.', color: '#e8e0d4' },
  { name: 'Crepusculo', time: '18h — 05h', description: 'Reflexao e encerramento. O ciclo se fecha, a consciencia se aprofunda.', color: '#8a6e5a' },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } },
};

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#111318', display: 'flex', flexDirection: 'column' }}>
      {/* Hero — full viewport */}
      <section style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center' }}>
        <BackgroundOrb />
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '440px', width: '100%' }}
        >
          <motion.div variants={stagger.item}>
            <LogoMark size={28} />
          </motion.div>
          <motion.h1
            variants={stagger.item}
            style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '13px', fontWeight: 400, color: '#a8947860', letterSpacing: '0.35em', textTransform: 'uppercase', marginTop: '16px', marginBottom: 0 }}
          >
            MindRoot
          </motion.h1>
          <motion.p
            variants={stagger.item}
            style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(32px, 8vw, 52px)', fontWeight: 300, fontStyle: 'italic', color: '#e8e0d4', lineHeight: 1.25, letterSpacing: '-0.01em', marginTop: '40px', marginBottom: 0 }}
          >
            Emocao precede acao,<br />reflexao fecha o ciclo
          </motion.p>
          <motion.p
            variants={stagger.item}
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 300, color: '#a8947868', lineHeight: 1.7, marginTop: '24px', marginBottom: 0 }}
          >
            Um sistema de produtividade que comeca por dentro.
            Conecte como voce se sente ao que voce faz.
          </motion.p>
          <motion.div
            variants={stagger.item}
            style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            <button
              onClick={onLogin}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#111318', backgroundColor: '#c4a882', border: 'none', borderRadius: '8px', padding: '13px 48px', cursor: 'pointer', letterSpacing: '0.03em' }}
            >
              Comecar agora
            </button>
            <button
              onClick={onLogin}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 400, color: '#a8947858', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.02em', padding: '4px' }}
            >
              Ja tenho conta
            </button>
          </motion.div>
        </motion.div>
        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)' }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1, height: 32, backgroundColor: '#a8947828' }}
          />
        </motion.div>
      </section>

      {/* Periods */}
      <section style={{ padding: '80px 32px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: '#a8947840', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '32px' }}
        >
          Tres periodos. Um ciclo completo.
        </motion.p>
        {PERIODS.map((period, i) => (
          <PeriodRow key={period.name} {...period} index={i} />
        ))}
        <div style={{ borderTop: '1px solid #a8947812' }} />
      </section>

      {/* Final CTA */}
      <section style={{ padding: '60px 32px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '22px', fontWeight: 300, fontStyle: 'italic', color: '#a89478', textAlign: 'center', margin: 0 }}
        >
          Comece hoje. Cinco minutos por dia.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          onClick={onLogin}
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#111318', backgroundColor: '#c4a882', border: 'none', borderRadius: '8px', padding: '13px 48px', cursor: 'pointer', letterSpacing: '0.03em' }}
        >
          Criar conta gratuita
        </motion.button>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', color: '#a8947828', letterSpacing: '0.1em' }}>
          MindRoot v1.0.0
        </span>
      </section>
    </div>
  );
}
