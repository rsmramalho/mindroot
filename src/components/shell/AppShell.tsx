// components/shell/AppShell.tsx — Layout principal
import type { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  onOpenSettings?: () => void;
}

export function AppShell({ children, onOpenSettings }: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <TopBar onOpenSettings={onOpenSettings} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
