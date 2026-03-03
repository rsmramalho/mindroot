// App.tsx — Router + Providers (< 80 linhas)
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/app-store';
import { AppShell } from '@/components/shell/AppShell';

// Pages
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
}

function AuthenticatedApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <AppShell onOpenSettings={() => setSettingsOpen(true)}>
      <PageRouter />
      <CommandPalette />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppShell>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-light animate-pulse">MindRoot</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
