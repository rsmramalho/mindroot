// components/shell/AppShell.tsx — Layout principal
// alpha.10: Toast container mounted here
// alpha.13: Offline sync hook
import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import ToastContainer from '@/components/shared/Toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface AppShellProps {
  children: ReactNode;
  onOpenSettings?: () => void;
}

export function AppShell({ children, onOpenSettings }: AppShellProps) {
  useOfflineSync();
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <TopBar onOpenSettings={onOpenSettings} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-20">
        {children}
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
