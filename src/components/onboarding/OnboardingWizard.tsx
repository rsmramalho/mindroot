// components/onboarding/OnboardingWizard.tsx — 3-step guided onboarding
// Step 1: Name + focus area | Step 2: Ritual periods | Step 3: First entry

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useRitualStore } from '@/store/ritual-store';
import { useAppStore } from '@/store/app-store';
import { itemService } from '@/service/item-service';
import { LogoMark } from '@/components/shared/Logo';
import type { RitualPeriod, ItemModule } from '@/types/item';

// ─── Data ───────────────────────────────────────────────────

const FOCUS_AREAS: { key: ItemModule; label: string; color: string }[] = [
  { key: 'work', label: 'Trabalho', color: '#8a9e7a' },
  { key: 'body', label: 'Saude', color: '#b8c4a8' },
  { key: 'family', label: 'Familia', color: '#d4856a' },
  { key: 'mind', label: 'Estudo', color: '#a89478' },
  { key: 'purpose', label: 'Projetos', color: '#c4a882' },
  { key: 'soul', label: 'Pessoal', color: '#8a6e5a' },
];

const PERIODS: { key: RitualPeriod; label: string; icon: string; desc: string; color: string }[] = [
  {
    key: 'aurora',
    label: 'Aurora',
    icon: '[Amanhecer]',
    desc: 'Manha — momento de intencao e clareza para o dia',
    color: '#f0c674',
  },
  {
    key: 'zenite',
    label: 'Zenite',
    icon: '[Meio-dia]',
    desc: 'Tarde — pico de acao, foco e energia',
    color: '#e8e0d4',
  },
  {
    key: 'crepusculo',
    label: 'Crepusculo',
    icon: '[Entardecer]',
    desc: 'Noite — reflexao, encerramento e gratidao',
    color: '#8a6e5a',
  },
];

const PERIOD_PLACEHOLDERS: Record<RitualPeriod, string> = {
  aurora: 'O que voce pretende fazer hoje?',
  zenite: 'No que voce esta focado agora?',
  crepusculo: 'Como foi seu dia?',
};

// ─── Slide animation variants ───────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
  }),
};

// ─── Component ──────────────────────────────────────────────

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const setOnboardingDone = useOnboardingStore((s) => s.setOnboardingDone);
  const user = useAppStore((s) => s.user);

  // Step 1 state
  const [name, setName] = useState('');
  const [focusArea, setFocusArea] = useState<ItemModule | null>(null);

  // Step 2 state
  const [selectedPeriod, setSelectedPeriod] = useState<RitualPeriod | null>(null);

  // Step 3 state
  const [entryText, setEntryText] = useState('');
  const [creating, setCreating] = useState(false);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 2));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const finishOnboarding = useCallback(() => {
    // Save selected period to ritual store
    if (selectedPeriod) {
      useRitualStore.getState().refreshPeriod();
    }
    setOnboardingDone();
  }, [selectedPeriod, setOnboardingDone]);

  const handleCreateEntry = useCallback(async () => {
    if (!entryText.trim() || !user) {
      finishOnboarding();
      return;
    }

    setCreating(true);
    try {
      await itemService.create({
        title: entryText.trim(),
        type: 'task',
        user_id: user.id,
        module: focusArea,
        ritual_period: selectedPeriod,
      });
    } catch {
      // Silently continue — don't block onboarding
    }
    setCreating(false);
    finishOnboarding();
  }, [entryText, user, focusArea, selectedPeriod, finishOnboarding]);

  const canAdvance = step === 0 ? true : step === 1 ? true : true;

  const currentPeriod = selectedPeriod || 'aurora';

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ backgroundColor: '#111318' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5">
        {step > 0 ? (
          <button
            onClick={goBack}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#a8947860',
              padding: '8px 0',
            }}
          >
            ← Voltar
          </button>
        ) : (
          <div />
        )}
        <LogoMark size={20} />
        <div style={{ width: 60 }} />
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 3, backgroundColor: '#a8947815' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#c4a882' }}
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              color: '#a8947840',
            }}
          >
            {step + 1}/3
          </span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center w-full">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full px-6"
            >
              <StepWelcome
                name={name}
                onNameChange={setName}
                focusArea={focusArea}
                onFocusAreaChange={setFocusArea}
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full px-6"
            >
              <StepRituals
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full px-6"
            >
              <StepFirstEntry
                entryText={entryText}
                onEntryTextChange={setEntryText}
                placeholder={PERIOD_PLACEHOLDERS[currentPeriod]}
                creating={creating}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-10">
        {step < 2 ? (
          <button
            onClick={goNext}
            disabled={!canAdvance}
            className="w-full transition-all duration-200 disabled:opacity-40"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: '#111318',
              backgroundColor: '#c4a882',
              borderRadius: '10px',
              padding: '14px',
            }}
          >
            Proximo
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreateEntry}
              disabled={creating || !entryText.trim()}
              className="w-full transition-all duration-200 disabled:opacity-40"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 500,
                color: '#111318',
                backgroundColor: '#c4a882',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              {creating ? '...' : 'Criar entrada'}
            </button>
            <button
              onClick={finishOnboarding}
              disabled={creating}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#a8947860',
                padding: '10px',
              }}
            >
              Pular por agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ────────────────────────────────────────

function StepWelcome({
  name,
  onNameChange,
  focusArea,
  onFocusAreaChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  focusArea: ItemModule | null;
  onFocusAreaChange: (v: ItemModule | null) => void;
}) {
  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      <h1
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '28px',
          fontWeight: 300,
          color: '#e8e0d4',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        Bem-vindo ao MindRoot
      </h1>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 300,
          color: '#a8947870',
          lineHeight: 1.6,
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        Vamos personalizar sua experiencia
      </p>

      {/* Name input */}
      <div className="w-full mb-6">
        <label
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 500,
            color: '#a8947880',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Como voce quer ser chamado?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Seu nome"
          className="w-full focus:outline-none transition-colors"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            color: '#e8e0d4',
            backgroundColor: '#1a1d24',
            border: '1px solid #2a2d34',
            borderRadius: '10px',
            padding: '14px 16px',
          }}
        />
      </div>

      {/* Focus area */}
      <div className="w-full">
        <label
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 500,
            color: '#a8947880',
            display: 'block',
            marginBottom: '10px',
          }}
        >
          Qual area voce quer organizar primeiro?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_AREAS.map((area) => {
            const selected = focusArea === area.key;
            return (
              <button
                key={area.key}
                type="button"
                onClick={() => onFocusAreaChange(selected ? null : area.key)}
                className="flex items-center gap-2 rounded-lg transition-all duration-150"
                aria-label={area.label}
                style={{
                  padding: '12px 14px',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: selected ? 600 : 400,
                  color: selected ? '#111318' : area.color,
                  backgroundColor: selected ? area.color : `${area.color}10`,
                  border: `1px solid ${selected ? area.color : `${area.color}25`}`,
                  textAlign: 'left',
                }}
              >
                <span
                  className="inline-block rounded-full shrink-0"
                  style={{
                    width: 6,
                    height: 6,
                    backgroundColor: selected ? '#111318' : area.color,
                    opacity: 0.7,
                  }}
                />
                {area.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Rituals ────────────────────────────────────────

function StepRituals({
  selectedPeriod,
  onPeriodChange,
}: {
  selectedPeriod: RitualPeriod | null;
  onPeriodChange: (p: RitualPeriod) => void;
}) {
  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      <h1
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '28px',
          fontWeight: 300,
          color: '#e8e0d4',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        Seu dia em 3 periodos
      </h1>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 300,
          color: '#a8947870',
          lineHeight: 1.6,
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        MindRoot organiza seu dia em 3 periodos rituais
      </p>

      <div className="w-full flex flex-col gap-3">
        {PERIODS.map((period) => {
          const selected = selectedPeriod === period.key;
          return (
            <button
              key={period.key}
              type="button"
              onClick={() => onPeriodChange(period.key)}
              className="w-full text-left rounded-xl transition-all duration-200"
              aria-label={period.label}
              style={{
                padding: '16px',
                backgroundColor: selected ? `${period.color}12` : '#1a1d24',
                border: `1px solid ${selected ? `${period.color}50` : '#a8947810'}`,
              }}
            >
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="inline-block rounded-full shrink-0"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: period.color,
                    opacity: selected ? 0.9 : 0.5,
                  }}
                />
                <span
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '18px',
                    fontWeight: 400,
                    color: period.color,
                  }}
                >
                  {period.label}
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '10px',
                    color: '#a8947840',
                    marginLeft: 'auto',
                  }}
                >
                  {period.icon}
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 300,
                  color: '#a8947870',
                  paddingLeft: '20px',
                  lineHeight: 1.4,
                }}
              >
                {period.desc}
              </p>
            </button>
          );
        })}
      </div>

      <p
        className="mt-6"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          fontWeight: 400,
          color: '#a8947850',
          textAlign: 'center',
        }}
      >
        Qual periodo voce esta agora?
      </p>
    </div>
  );
}

// ─── Step 3: First entry ────────────────────────────────────

function StepFirstEntry({
  entryText,
  onEntryTextChange,
  placeholder,
  creating,
}: {
  entryText: string;
  onEntryTextChange: (v: string) => void;
  placeholder: string;
  creating: boolean;
}) {
  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      <h1
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '28px',
          fontWeight: 300,
          color: '#e8e0d4',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        Sua primeira entrada
      </h1>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 300,
          color: '#a8947870',
          lineHeight: 1.6,
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        Vamos criar sua primeira tarefa
      </p>

      <div className="w-full">
        <input
          type="text"
          value={entryText}
          onChange={(e) => onEntryTextChange(e.target.value)}
          placeholder={placeholder}
          disabled={creating}
          className="w-full focus:outline-none transition-colors disabled:opacity-50"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            color: '#e8e0d4',
            backgroundColor: '#1a1d24',
            border: '1px solid #2a2d34',
            borderRadius: '10px',
            padding: '16px',
          }}
        />
        <p
          className="mt-3"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#a8947840',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Escreva em linguagem natural — o MindRoot entende
        </p>
      </div>
    </div>
  );
}

export default OnboardingWizard;
