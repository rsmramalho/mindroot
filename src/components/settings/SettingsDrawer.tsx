// components/settings/SettingsDrawer.tsx — Settings overlay
// Sign out, notifications, PWA install, about

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from '@/hooks/usePWA';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppStore } from '@/store/app-store';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { user, signOut } = useAuth();
  const { canInstall, isInstalled, promptInstall } = usePWA();
  const { supported: notifSupported, enabled: notifEnabled, enable: enableNotif } =
    useNotifications();
  const navigate = useAppStore((s) => s.navigate);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleAnalytics = () => {
    navigate('analytics');
    onClose();
  };

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
        className="h-full w-full max-w-xs overflow-y-auto"
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
            <SettingsItem
              label="Notificacoes"
              description={
                notifEnabled
                  ? 'Ativas — transicoes de periodo'
                  : 'Receba alertas de ritual e itens atrasados'
              }
              onClick={enableNotif}
              trailing={
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '10px',
                    color: notifEnabled ? '#8a9e7a' : '#a8947850',
                    backgroundColor: notifEnabled ? '#8a9e7a15' : '#a8947810',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${notifEnabled ? '#8a9e7a30' : '#a8947815'}`,
                  }}
                >
                  {notifEnabled ? 'on' : 'off'}
                </span>
              }
            />
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

          {/* Keyboard shortcut hint */}
          <SettingsItem
            label="Paleta de comandos"
            description="Ctrl+K ou Cmd+K para acesso rapido"
            disabled
          />

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
            MindRoot v1.0.0-alpha.5
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
