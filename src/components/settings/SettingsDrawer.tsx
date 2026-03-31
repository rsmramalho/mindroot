// components/settings/SettingsDrawer.tsx — Settings overlay
// Sign out, notifications, PWA install, about

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppStore } from '@/store/app-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeStore } from '@/store/theme-store';
import { useItems } from '@/hooks/useItems';
import { exportJournalMarkdown, exportAllDataJson } from '@/engine/export';
import { SECTION_LABELS, DEFAULT_MODULE_COLORS } from '@/engine/theme';
import type { DashboardSection } from '@/engine/theme';
import { MODULES } from '@/types/item';
import type { AtomModule } from '@/types/item';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { user, signOut } = useAuth();
  const { canInstall, isInstalled, promptInstall } = usePWA();
  const { supported: notifSupported, enabled: notifEnabled, enable: enableNotif, disable: disableNotif, periodTransitions, overdueReminders, ritualReminders, pushSubscribed, permissionState, setPreference } =
    useNotifications();
  const navigate = useAppStore((s) => s.navigate);
  const { items } = useItems();
  const {
    mode: themeMode,
    moduleColors,
    dashboardOrder,
    toggleTheme,
    setModuleColor,
    resetModuleColors,
    moveDashboardSectionUp,
    moveDashboardSectionDown,
    resetDashboardOrder,
  } = useThemeStore();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleAnalytics = () => {
    navigate('analytics');
    onClose();
  };

  const drawerRef = useRef<HTMLDivElement>(null);

  // Escape to close + focus trap
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
    <motion.div
      className="fixed inset-0 z-[55] flex items-start justify-end"
      style={{ backgroundColor: '#111318d0' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={drawerRef}
        className="h-full w-full max-w-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Ajustes"
        style={{
          backgroundColor: '#1a1d24',
          borderLeft: '1px solid #a8947815',
        }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '20px 20px 12px' }}
        >
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '20px',
              fontWeight: 400,
              color: '#e8e0d4',
            }}
          >
            Ajustes
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar ajustes"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '16px',
              color: '#a8947860',
              padding: '4px 8px',
            }}
          >
            x
          </button>
        </div>

        {/* User info */}
        {user && (
          <div style={{ padding: '0 20px 16px' }}>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#a8947860',
                display: 'block',
              }}
            >
              {user.email}
            </span>
          </div>
        )}

        <div
          style={{ height: 1, backgroundColor: '#a8947812', margin: '0 20px' }}
        />

        {/* Menu items */}
        <div style={{ padding: '12px 12px' }}>
          {/* Analytics */}
          <SettingsItem
            label="Analytics"
            description="Tendencias emocionais e estatisticas"
            onClick={handleAnalytics}
          />

          {/* Notifications */}
          {notifSupported && (
            <>
              <SettingsItem
                label="Notificacoes"
                description={
                  permissionState === 'denied'
                    ? 'Bloqueadas pelo navegador'
                    : notifEnabled
                    ? `Ativas${pushSubscribed ? ' — push ativo' : ' — local'}`
                    : 'Receba alertas de ritual e itens atrasados'
                }
                onClick={notifEnabled ? disableNotif : enableNotif}
                trailing={
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '10px',
                      color: permissionState === 'denied'
                        ? '#e85d5d80'
                        : notifEnabled ? '#8a9e7a' : '#a8947850',
                      backgroundColor: permissionState === 'denied'
                        ? '#e85d5d10'
                        : notifEnabled ? '#8a9e7a15' : '#a8947810',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${
                        permissionState === 'denied'
                          ? '#e85d5d20'
                          : notifEnabled ? '#8a9e7a30' : '#a8947815'
                      }`,
                    }}
                  >
                    {permissionState === 'denied' ? 'bloq' : notifEnabled ? 'on' : 'off'}
                  </span>
                }
              />

              {/* Granular toggles — only when enabled */}
              {notifEnabled && (
                <>
                  <SettingsToggle
                    label="Transicoes de periodo"
                    checked={periodTransitions}
                    onChange={(v) => setPreference('periodTransitions', v)}
                  />
                  <SettingsToggle
                    label="Items atrasados"
                    checked={overdueReminders}
                    onChange={(v) => setPreference('overdueReminders', v)}
                  />
                  <SettingsToggle
                    label="Lembretes de ritual"
                    checked={ritualReminders}
                    onChange={(v) => setPreference('ritualReminders', v)}
                  />
                </>
              )}
            </>
          )}

          {/* PWA Install */}
          {canInstall && (
            <SettingsItem
              label="Instalar app"
              description="Adicione MindRoot a tela inicial"
              onClick={promptInstall}
            />
          )}
          {isInstalled && (
            <SettingsItem
              label="App instalado"
              description="MindRoot esta na sua tela inicial"
              disabled
            />
          )}

          <div
            style={{
              height: 1,
              backgroundColor: '#a8947810',
              margin: '8px 8px',
            }}
          />

          {/* Theme */}
          <SettingsItem
            label="Tema"
            description={themeMode === 'dark' ? 'Escuro — padrao' : 'Claro'}
            onClick={toggleTheme}
            trailing={
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '10px',
                  color: themeMode === 'light' ? '#c4a882' : '#a8947850',
                  backgroundColor: themeMode === 'light' ? '#c4a88215' : '#a8947810',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${themeMode === 'light' ? '#c4a88230' : '#a8947815'}`,
                }}
              >
                {themeMode === 'dark' ? 'escuro' : 'claro'}
              </span>
            }
          />

          {/* Module Colors */}
          <SettingsSectionHeader label="Cores dos modulos" onReset={resetModuleColors} />
          {MODULES.map((m) => (
            <ModuleColorRow
              key={m.key}
              module={m.key}
              label={m.label}
              color={moduleColors[m.key]}
              defaultColor={DEFAULT_MODULE_COLORS[m.key]}
              onChange={(c) => setModuleColor(m.key, c)}
            />
          ))}

          {/* Dashboard Order */}
          <SettingsSectionHeader label="Ordem do dashboard" onReset={resetDashboardOrder} />
          {dashboardOrder.map((section, idx) => (
            <DashboardOrderRow
              key={section}
              section={section}
              isFirst={idx === 0}
              isLast={idx === dashboardOrder.length - 1}
              onMoveUp={() => moveDashboardSectionUp(section)}
              onMoveDown={() => moveDashboardSectionDown(section)}
            />
          ))}

          <div
            style={{
              height: 1,
              backgroundColor: '#a8947810',
              margin: '8px 8px',
            }}
          />

          {/* Export & Backup */}
          <SettingsItem
            label="Exportar diario"
            description="Baixar journal como Markdown (.md)"
            onClick={() => exportJournalMarkdown(items)}
          />
          <SettingsItem
            label="Backup completo"
            description="Baixar todos os dados como JSON"
            onClick={() => exportAllDataJson(items)}
          />

          <div
            style={{
              height: 1,
              backgroundColor: '#a8947810',
              margin: '8px 8px',
            }}
          />

          {/* Keyboard shortcut hint */}
          <SettingsItem
            label="Paleta de comandos"
            description="Ctrl+K ou Cmd+K para acesso rapido"
            disabled
          />

          {/* Reset onboarding — dev/testing only */}
          {import.meta.env.DEV && (
            <SettingsItem
              label="Resetar onboarding"
              description="Rever fluxo de boas-vindas"
              onClick={() => {
                useOnboardingStore.getState().resetOnboarding(user?.id);
                onClose();
              }}
            />
          )}

          <div
            style={{
              height: 1,
              backgroundColor: '#a8947810',
              margin: '8px 8px',
            }}
          />

          {/* Sign out */}
          <SettingsItem
            label="Sair"
            description="Encerrar sessao"
            onClick={handleSignOut}
            danger
          />
        </div>

        {/* Version */}
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px',
              color: '#a8947825',
            }}
          >
            MindRoot v1.0.0
          </span>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Settings Item ─────────────────────────────────────

function SettingsItem({
  label,
  description,
  onClick,
  trailing,
  disabled = false,
  danger = false,
}: {
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left flex items-center gap-3 rounded-lg transition-all duration-150"
      style={{
        padding: '12px 12px',
        backgroundColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <div className="flex-1 min-w-0">
        <span
          className="block"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: danger ? '#e85d5d' : '#e8e0d4',
          }}
        >
          {label}
        </span>
        {description && (
          <span
            className="block mt-0.5"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              color: '#a8947860',
              fontWeight: 400,
            }}
          >
            {description}
          </span>
        )}
      </div>
      {trailing}
    </button>
  );
}

// ─── Settings Toggle (checkbox-style sub-item) ─────────────

function SettingsToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full text-left flex items-center gap-3 rounded-lg transition-all duration-150"
      style={{
        padding: '8px 12px 8px 32px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      <div className="flex-1 min-w-0">
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 400,
            color: checked ? '#e8e0d4' : '#a8947860',
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '9px',
          color: checked ? '#8a9e7a' : '#a8947840',
          backgroundColor: checked ? '#8a9e7a10' : 'transparent',
          padding: '2px 6px',
          borderRadius: '4px',
          border: `1px solid ${checked ? '#8a9e7a25' : '#a8947815'}`,
        }}
      >
        {checked ? 'on' : 'off'}
      </span>
    </button>
  );
}

// ─── Settings Section Header ────────────────────────────────

function SettingsSectionHeader({ label, onReset }: { label: string; onReset?: () => void }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '12px 12px 4px' }}>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          fontWeight: 500,
          color: '#a8947850',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      {onReset && (
        <button
          onClick={onReset}
          className="transition-opacity duration-150 hover:opacity-80"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '9px',
            color: '#a8947835',
            padding: '2px 6px',
          }}
        >
          resetar
        </button>
      )}
    </div>
  );
}

// ─── Module Color Row ───────────────────────────────────────

const COLOR_PRESETS = [
  '#c4a882', '#8a9e7a', '#d4856a', '#b8c4a8', '#a89478', '#8a6e5a',
  '#e8a84c', '#7aa8c4', '#c47a9e', '#9e7ac4', '#7ac4b8', '#c4c47a',
];

function ModuleColorRow({
  module,
  label,
  color,
  defaultColor,
  onChange,
}: {
  module: AtomModule;
  label: string;
  color: string;
  defaultColor: string;
  onChange: (color: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: '6px 12px 6px 24px' }}
    >
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: color,
          fontWeight: 400,
          minWidth: '70px',
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1 flex-wrap flex-1">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            aria-label={`Cor ${preset}`}
            className="transition-transform duration-100 hover:scale-125"
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: preset,
              border: color === preset ? '2px solid #e8e0d4' : '1px solid #a8947820',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Order Row ────────────────────────────────────

function DashboardOrderRow({
  section,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  section: DashboardSection;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2"
      style={{ padding: '6px 12px 6px 24px' }}
    >
      <span
        className="flex-1"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#e8e0d4cc',
          fontWeight: 400,
        }}
      >
        {SECTION_LABELS[section]}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={`Mover ${SECTION_LABELS[section]} para cima`}
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '12px',
            color: isFirst ? '#a8947820' : '#a8947860',
            padding: '2px 6px',
            cursor: isFirst ? 'default' : 'pointer',
          }}
        >
          ^
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={`Mover ${SECTION_LABELS[section]} para baixo`}
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '12px',
            color: isLast ? '#a8947820' : '#a8947860',
            padding: '2px 6px',
            cursor: isLast ? 'default' : 'pointer',
          }}
        >
          v
        </button>
      </div>
    </div>
  );
}
