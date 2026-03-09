// components/shell/BottomNav.tsx — ⌂ ▦ ◎ ○
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import type { AppPage } from '@/types/ui';

interface NavItem {
  page: AppPage;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'home',      icon: '⌂', label: 'Home' },
  { page: 'projects',  icon: '▧', label: 'Projetos' },
  { page: 'calendar',  icon: '▦', label: 'Agenda' },
  { page: 'ritual',    icon: '◎', label: 'Ritual' },
  { page: 'journal',   icon: '○', label: 'Journal' },
];

export function BottomNav() {
  const { currentPage, navigate } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg/90 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {NAV_ITEMS.map(({ page, icon, label }) => {
          const active = currentPage === page || (page === 'projects' && currentPage === 'project-detail');
          return (
            <button
              key={page}
              onClick={() => navigate(page)}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-4 py-1 transition-colors ${
                active ? 'text-mind' : 'text-muted hover:text-light'
              }`}
            >
              <motion.span
                className="text-lg font-mono leading-none"
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {icon}
              </motion.span>
              <span className="text-[10px] font-sans">{label}</span>

              {/* Active indicator bar */}
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-2 right-2 h-[2px] rounded-full bg-mind"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
