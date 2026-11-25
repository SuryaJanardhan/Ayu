import React from 'react';
import { Home, UtensilsCrossed, Plus, Dumbbell, TrendingUp } from 'lucide-react';

export type TabType = 'home' | 'meals' | 'train' | 'progress';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenQuickSnap: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickSnap,
}) => {
  return (
    <nav className="sticky bottom-0 z-30 bg-white border-t border-cream-200 px-4 py-2 flex items-center justify-around shadow-[0_-4px_16px_rgba(26,16,51,0.03)]">
      {/* Home */}
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-coral font-bold' : 'text-ink-mute hover:text-ink'
          }`}
      >
        <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        <span className="text-[10px] tracking-tight">Home</span>
      </button>

      {/* Meals */}
      <button
        onClick={() => onTabChange('meals')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'meals' ? 'text-coral font-bold' : 'text-ink-mute hover:text-ink'
          }`}
      >
        <UtensilsCrossed size={20} strokeWidth={activeTab === 'meals' ? 2.5 : 2} />
        <span className="text-[10px] tracking-tight">Meals</span>
      </button>

      {/* Center Floating Action Button (FAB) */}
      <button
        onClick={onOpenQuickSnap}
        className="w-12 h-12 rounded-full bg-coral hover:bg-coral-hover text-white flex items-center justify-center -mt-6 shadow-fab active:scale-95 transition-all"
        title="Snap Meal or Quick Log"
      >
        <Plus size={26} strokeWidth={2.8} />
      </button>

      {/* Train */}
      <button
        onClick={() => onTabChange('train')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'train' ? 'text-coral font-bold' : 'text-ink-mute hover:text-ink'
          }`}
      >
        <Dumbbell size={20} strokeWidth={activeTab === 'train' ? 2.5 : 2} />
        <span className="text-[10px] tracking-tight">Train</span>
      </button>

      {/* Progress */}
      <button
        onClick={() => onTabChange('progress')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'progress' ? 'text-coral font-bold' : 'text-ink-mute hover:text-ink'
          }`}
      >
        <TrendingUp size={20} strokeWidth={activeTab === 'progress' ? 2.5 : 2} />
        <span className="text-[10px] tracking-tight">Progress</span>
      </button>
    </nav>
  );
};
