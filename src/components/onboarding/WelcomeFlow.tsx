// components/onboarding/WelcomeFlow.tsx — 3-screen welcome after first login
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/store/onboarding-store';
import { LogoMark } from '@/components/shared/Logo';
import WelcomeStep from './WelcomeStep';

const TRIAD_ITEMS = [
  {
    label: 'Emocao',
    desc: 'Como voce se sente antes e depois de cada acao',
    color: '#d4856a',
  },
  {
    label: 'Acao',
    desc: 'Tarefas, habitos, rituais — tudo o que voce faz',
    color: '#c4a882',
  },
  {
    label: 'Tempo',
    desc: 'Quando, com que frequencia, e o ritmo do seu dia',
    color: '#8a9e7a',
  },
];

const MODULES = [
  { label: 'Proposito', color: '#c4a882' },
  { label: 'Trabalho', color: '#8a9e7a' },
  { label: 'Familia', color: '#d4856a' },
  { label: 'Corpo', color: '#b8c4a8' },
  { label: 'Mente', color: '#a89478' },
  { label: 'Alma', color: '#8a6e5a' },
];

const RITUALS = [
  {
    label: 'Aurora',
    time: '05h — 12h',
    desc: 'Intencao do dia',
    color: '#f0c674',
  },
  {
    label: 'Zenite',
    time: '12h — 18h',
    desc: 'Pausa e recalibragem',
    color: '#e8e0d4',
  },
  {
    label: 'Crepusculo',
    time: '18h — 05h',
    desc: 'Reflexao e encerramento',
    color: '#8a6e5a',
  },
];

export default function WelcomeFlow() {
  const [step, setStep] = useState(0);
  const setOnboardingDone = useOnboardingStore((s) => s.setOnboardingDone);

  const handleNext = useCallback(() => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setOnboardingDone();
    }
  }, [step, setOnboardingDone]);

  const handleSkip = useCallback(() => {
    setOnboardingDone();
  }, [setOnboardingDone]);

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between"
      style={{ backgroundColor: '#111318' }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center pt-12 pb-4">
        <LogoMark size={28} />
      </div>

      {/* Steps */}
      <div className="flex-1 flex items-center w-full max-w-lg px-4">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <WelcomeStep
              key="triad"
              title="Emocao precede acao"
              subtitle="MindRoot conecta o que voce sente ao que voce faz. Tres eixos guiam tudo:"
            >
              <div className="flex flex-col gap-3 mt-2">
                {TRIAD_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 text-left"
                    style={{
                      backgroundColor: '#1a1d24',
                      borderRadius: '10px',
                      border: '1px solid #a8947810',
                      padding: '14px 16px',
                    }}
                  >
                    <span
                      className="inline-block rounded-full mt-1 shrink-0"
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: item.color,
                        opacity: 0.7,
                      }}
                    />
                    <div>
                      <span
                        style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontSize: '17px',
                          fontWeight: 400,
                          color: item.color,
                        }}
                      >
                        {item.label}
                      </span>
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          fontWeight: 300,
                          color: '#a8947870',
                          marginTop: '2px',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </WelcomeStep>
          )}

          {step === 1 && (
            <WelcomeStep
              key="modules"
              title="Seus modulos"
              subtitle="Cada area da sua vida tem um espaco. Classifique tarefas por modulo para manter equilibrio."
            >
              <div className="grid grid-cols-2 gap-2 mt-2">
                {MODULES.map((mod) => (
                  <div
                    key={mod.label}
                    className="flex items-center gap-2"
                    style={{
                      backgroundColor: '#1a1d24',
                      borderRadius: '10px',
                      border: '1px solid #a8947810',
                      padding: '12px 14px',
                    }}
                  >
                    <span
                      className="inline-block rounded-full shrink-0"
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: mod.color,
                        opacity: 0.7,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        fontWeight: 400,
                        color: '#e8e0d4cc',
                      }}
                    >
                      {mod.label}
                    </span>
                  </div>
                ))}
              </div>
            </WelcomeStep>
          )}

          {step === 2 && (
            <WelcomeStep
              key="rituals"
              title="Seus rituais"
              subtitle="Tres momentos do dia para intencao, pausa e reflexao. O ciclo fecha com o journal."
            >
              <div className="flex flex-col gap-3 mt-2">
                {RITUALS.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center gap-3"
                    style={{
                      backgroundColor: '#1a1d24',
                      borderRadius: '10px',
                      border: '1px solid #a8947810',
                      padding: '14px 16px',
                    }}
                  >
                    <span
                      className="inline-block rounded-full shrink-0"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: r.color,
                        opacity: 0.6,
                      }}
                    />
                    <div className="flex-1 text-left">
                      <div className="flex items-baseline gap-2">
                        <span
                          style={{
                            fontFamily: '"Cormorant Garamond", serif',
                            fontSize: '17px',
                            fontWeight: 400,
                            color: r.color,
                          }}
                        >
                          {r.label}
                        </span>
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '10px',
                            color: '#a8947840',
                          }}
                        >
                          {r.time}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          fontWeight: 300,
                          color: '#a8947860',
                          marginTop: '2px',
                        }}
                      >
                        {r.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </WelcomeStep>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="w-full max-w-lg px-6 pb-10">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                backgroundColor: i === step ? '#c4a882' : '#a8947830',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: '#a8947840',
              padding: '10px 16px',
            }}
          >
            Pular
          </button>

          <button
            onClick={handleNext}
            className="transition-all duration-200"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#111318',
              backgroundColor: '#c4a882',
              borderRadius: '10px',
              padding: '12px 28px',
            }}
          >
            {step < 2 ? 'Continuar' : 'Comecar'}
          </button>
        </div>
      </div>
    </div>
  );
}
