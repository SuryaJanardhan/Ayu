import React from 'react';
import { Home, UtensilsCrossed, Plus, Dumbbell, TrendingUp, LucideIcon } from 'lucide-react';

export type TabType = 'home' | 'meals' | 'train' | 'progress';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenQuickSnap: () => void;
}

const TABS: { id: TabType; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { id: 'train', label: 'Train', icon: Dumbbell },
  { id: 'progress', label: 'Stats', icon: TrendingUp },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickSnap,
}) => {
  return (
    <div className="shrink-0 z-30 px-3 pb-3 pt-1.5 bg-gradient-to-t from-cream-100 via-cream-100/95 to-transparent">
      <div className="flex items-center gap-2.5">
        {/* Floating White & Coral Pill Dock */}
        <nav
          aria-label="Primary navigation"
          className="flex-1 bg-white/95 backdrop-blur-md border border-cream-200 rounded-full p-1.5 flex items-center justify-between shadow-[0_8px_24px_rgba(26,16,51,0.08)]"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-coral text-white font-bold shadow-[0_4px_12px_rgba(255,92,53,0.28)]'
                    : 'text-ink-mute hover:text-ink font-medium'
                }`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && <span className="text-[11px] tracking-tight">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Detached Coral Quick Snap Button */}
        <button
          onClick={onOpenQuickSnap}
          className="w-12 h-12 rounded-full bg-coral hover:bg-coral-hover text-white flex items-center justify-center shadow-fab active:scale-95 transition-all shrink-0"
          title="Snap Meal or Quick Log"
          aria-label="Quick log meal"
        >
          <Plus size={24} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
};
