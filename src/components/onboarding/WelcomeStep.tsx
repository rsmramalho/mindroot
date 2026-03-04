// components/onboarding/WelcomeStep.tsx — Reusable step for welcome flow
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface WelcomeStepProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function WelcomeStep({ title, subtitle, children }: WelcomeStepProps) {
  return (
    <motion.div
      className="flex flex-col items-center text-center px-6 py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <h1
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '28px',
          fontWeight: 300,
          color: '#e8e0d4',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          marginBottom: subtitle ? '8px' : '24px',
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 300,
            color: '#a8947880',
            lineHeight: 1.6,
            maxWidth: '320px',
            marginBottom: '24px',
          }}
        >
          {subtitle}
        </p>
      )}

      <div className="w-full max-w-sm">{children}</div>
    </motion.div>
  );
}
