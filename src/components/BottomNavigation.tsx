import React from 'react';
import { Home, UtensilsCrossed, Plus, Dumbbell, TrendingUp, LucideIcon } from 'lucide-react';

export type TabType = 'home' | 'meals' | 'train' | 'progress';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenQuickSnap: () => void;
}

const LEFT_TABS: { id: TabType; label: string; icon: LucideIcon; slot: number }[] = [
  { id: 'home', label: 'Home', icon: Home, slot: 0 },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed, slot: 1 },
];

const RIGHT_TABS: { id: TabType; label: string; icon: LucideIcon; slot: number }[] = [
  { id: 'train', label: 'Train', icon: Dumbbell, slot: 3 },
  { id: 'progress', label: 'Stats', icon: TrendingUp, slot: 4 },
];

const TAB_SLOT: Record<TabType, number> = {
  home: 0,
  meals: 1,
  train: 3,
  progress: 4,
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickSnap,
}) => {
  const activeSlot = TAB_SLOT[activeTab];

  const renderTab = ({ id, label, icon: Icon }: { id: TabType; label: string; icon: LucideIcon }) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => onTabChange(id)}
        className={`relative z-10 flex flex-col items-center justify-center py-1.5 rounded-full transition-colors duration-200 ${
          isActive ? 'text-white font-bold' : 'text-ink-mute hover:text-ink font-medium'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
        <span className="text-[10px] leading-tight mt-0.5 tracking-tight">{label}</span>
      </button>
    );
  };

  return (
    <div className="shrink-0 z-30 px-3 pb-3 pt-1.5 bg-gradient-to-t from-cream-100 via-cream-100/95 to-transparent">
      <nav
        aria-label="Primary navigation"
        className="relative bg-white/95 backdrop-blur-md border border-cream-200 rounded-full p-1.5 grid grid-cols-5 items-center shadow-[0_8px_24px_rgba(26,16,51,0.08)]"
      >
        {/* Smooth sliding coral pill indicator */}
        <div
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/5)] rounded-full bg-coral shadow-[0_4px_12px_rgba(255,92,53,0.3)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{ transform: `translateX(${activeSlot * 100}%)` }}
        />

        {LEFT_TABS.map(renderTab)}

        {/* Handy Center Quick-Snap Button */}
        <div className="relative z-10 flex items-center justify-center">
          <button
            onClick={onOpenQuickSnap}
            className="w-12 h-12 -my-2 rounded-full bg-coral hover:bg-coral-hover text-white flex items-center justify-center shadow-fab active:scale-95 transition-transform"
            title="Snap Meal or Quick Log"
            aria-label="Quick log meal"
          >
            <Plus size={24} strokeWidth={2.8} />
          </button>
        </div>

        {RIGHT_TABS.map(renderTab)}
      </nav>
    </div>
  );
};
