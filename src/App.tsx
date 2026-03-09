// App.tsx — Router + Providers
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/app-store';
import { AppShell } from '@/components/shell/AppShell';
import { LogoFull } from '@/components/shared/Logo';

// Pages
import { SharedContentPage } from '@/pages/SharedContent';
import { AuthPage } from '@/pages/Auth';
import { HomePage } from '@/pages/Home';
import { InboxPage } from '@/pages/Inbox';
import { ProjectsPage } from '@/pages/Projects';
import { CalendarPage } from '@/pages/Calendar';
import { RitualPage } from '@/pages/Ritual';
import { JournalPage } from '@/pages/Journal';
import { AnalyticsPage } from '@/pages/Analytics';

// Global components
import CommandPalette from '@/components/shared/CommandPalette';
import SettingsDrawer from '@/components/settings/SettingsDrawer';
import WelcomeFlow from '@/components/onboarding/WelcomeFlow';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeStore } from '@/store/theme-store';
import { applyThemeToDom } from '@/engine/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageRouter() {
  const currentPage = useAppStore((s) => s.currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'inbox':
        return <InboxPage />;
      case 'projects':
      case 'project-detail':
        return <ProjectsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'ritual':
        return <RitualPage />;
      case 'journal':
        return <JournalPage />;
      case 'analytics':
        return <AnalyticsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  );
}

function AuthenticatedApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <AppShell onOpenSettings={() => setSettingsOpen(true)}>
      <ErrorBoundary>
        <PageRouter />
      </ErrorBoundary>
      <CommandPalette />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppShell>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const onboardingDone = useOnboardingStore((s) => s.onboardingDone);
  const themeMode = useThemeStore((s) => s.mode);
  const moduleColors = useThemeStore((s) => s.moduleColors);

  // Apply theme CSS vars on mount and when theme changes
  useEffect(() => {
    applyThemeToDom({ mode: themeMode, moduleColors, dashboardOrder: useThemeStore.getState().dashboardOrder });
  }, [themeMode, moduleColors]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <LogoFull
              iconSize={24}
              wordmarkSize="lg"
              variant="duo"
              layout="vertical"
            />
          </motion.div>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-mind/40 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!onboardingDone) {
    return <WelcomeFlow />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  // Intercept /share/:token before auth guard (public route)
  const shareMatch = window.location.pathname.match(/^\/share\/([a-f0-9-]{36})$/);

  if (shareMatch) {
    return (
      <QueryClientProvider client={queryClient}>
        <SharedContentPage token={shareMatch[1]} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
