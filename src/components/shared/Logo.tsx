// components/shared/Logo.tsx — MindRoot tree mark + wordmark
// P1 vertex from brand manual: branches (modules) + trunk (core) + roots (tríade)

interface LogoMarkProps {
  size?: number;
  className?: string;
}

// Tree icon — "Tríade" variant from brand manual
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  // Scale relative to the 160×160 viewBox
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Branches — going up */}
      <path d="M80 72 C72 52, 58 36, 44 18" stroke="#b8a088" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      <path d="M80 72 C78 48, 76 28, 80 6" stroke="#d4856a" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <path d="M80 72 C88 52, 102 36, 116 18" stroke="#8a9e7a" strokeWidth="2" opacity="0.45" strokeLinecap="round" />

      {/* Trunk — center line */}
      <path d="M80 72 L80 112" stroke="#e8e0d4" strokeWidth="2" opacity="0.25" strokeLinecap="round" />

      {/* Core node */}
      <circle cx="80" cy="72" r="3.5" fill="#e8e0d4" opacity="0.4" />

      {/* Root node */}
      <circle cx="80" cy="112" r="3.5" fill="#e8e0d4" opacity="0.35" />

      {/* Roots — tríade Mind/Heart/Soul */}
      <path d="M80 112 C72 132, 56 148, 40 174" stroke="#c4a882" strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M80 112 C80 136, 80 156, 81 184" stroke="#d4856a" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M80 112 C88 132, 104 148, 120 174" stroke="#8a9e7a" strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round" />
    </svg>
  );
}

interface LogoWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mono' | 'duo';
  className?: string;
}

const WORDMARK_SIZES = {
  sm: { fontSize: '18px', letterSpacing: '0.06em' },
  md: { fontSize: '24px', letterSpacing: '0.06em' },
  lg: { fontSize: '34px', letterSpacing: '0.08em' },
  xl: { fontSize: '44px', letterSpacing: '0.08em' },
};

// Wordmark: "Mind" + "Root" in Cormorant Garamond
export function LogoWordmark({ size = 'md', variant = 'duo', className }: LogoWordmarkProps) {
  const s = WORDMARK_SIZES[size];
  return (
    <span
      className={className}
      style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontWeight: 300,
        fontSize: s.fontSize,
        letterSpacing: s.letterSpacing,
        lineHeight: 1,
      }}
    >
      <span style={{ color: '#e8e0d4' }}>Mind</span>
      <span style={{ color: variant === 'duo' ? '#a89478' : '#e8e0d4' }}>Root</span>
    </span>
  );
}

interface LogoFullProps {
  iconSize?: number;
  wordmarkSize?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mono' | 'duo';
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

// Full logo: icon + wordmark
export function LogoFull({
  iconSize = 20,
  wordmarkSize = 'md',
  variant = 'duo',
  layout = 'horizontal',
  className,
}: LogoFullProps) {
  const isVertical = layout === 'vertical';
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        gap: isVertical ? '8px' : '10px',
      }}
    >
      <LogoMark size={iconSize} />
      <LogoWordmark size={wordmarkSize} variant={variant} />
    </div>
  );
}

export default LogoFull;
