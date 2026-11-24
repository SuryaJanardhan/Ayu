import React from 'react';
import { ChevronLeft, ChevronRight, Sliders, Database, RotateCcw } from 'lucide-react';
import { formatDateDisplay, getTodayDateString, shiftDate } from '../utils/date';

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  onOpenTargetModal: () => void;
  onOpenSettingsModal: () => void;
  onResetSeed: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onOpenTargetModal,
  onOpenSettingsModal,
  onResetSeed,
}) => {
  const today = getTodayDateString();
  const isToday = currentDate === today;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-telemetry-indigo flex items-center justify-center shadow-sm">
            <span className="font-extrabold text-sm tracking-tight text-white">AY</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">Ayu</h1>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">Telemetry</span>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-0.5">
          <button
            onClick={() => onDateChange(shiftDate(currentDate, -1))}
            className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 hover:shadow-xs transition-all"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button
            onClick={() => onDateChange(today)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              isToday
                ? 'bg-white text-brand-600 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isToday ? 'Today' : formatDateDisplay(currentDate)}
          </button>

          <button
            onClick={() => onDateChange(shiftDate(currentDate, 1))}
            className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 hover:shadow-xs transition-all"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenTargetModal}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-telemetry-amber hover:border-amber-300 hover:bg-amber-50/50 shadow-xs transition-all"
            title="Daily Target Overrides"
          >
            <Sliders size={16} />
          </button>
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-blue-300 hover:bg-blue-50/50 shadow-xs transition-all"
            title="Database Backup & Settings"
          >
            <Database size={16} />
          </button>
          <button
            onClick={onResetSeed}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-telemetry-emerald hover:border-emerald-300 hover:bg-emerald-50/50 shadow-xs transition-all"
            title="Reset Demo Data"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
