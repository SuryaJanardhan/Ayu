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
    <header className="sticky top-0 z-30 bg-obsidian-950/80 backdrop-blur-md border-b border-obsidian-700/60 px-4 py-3">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-indigo via-accent-cyan to-accent-emerald flex items-center justify-center p-[1px]">
            <div className="w-full h-full bg-obsidian-950 rounded-[7px] flex items-center justify-center">
              <span className="font-bold text-sm tracking-wider text-white">AY</span>
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">Ayu</h1>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Telemetry</span>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center bg-obsidian-800 border border-obsidian-700/80 rounded-xl px-1 py-1">
          <button
            onClick={() => onDateChange(shiftDate(currentDate, -1))}
            className="p-1 rounded-lg hover:bg-obsidian-700 text-slate-400 hover:text-white transition-colors"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button
            onClick={() => onDateChange(today)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              isToday
                ? 'bg-accent-indigo/20 text-accent-indigo border border-accent-indigo/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isToday ? 'Today' : formatDateDisplay(currentDate)}
          </button>

          <button
            onClick={() => onDateChange(shiftDate(currentDate, 1))}
            className="p-1 rounded-lg hover:bg-obsidian-700 text-slate-400 hover:text-white transition-colors"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenTargetModal}
            className="p-2 rounded-xl bg-obsidian-800 border border-obsidian-700/80 text-slate-300 hover:text-accent-amber hover:border-accent-amber/40 transition-colors"
            title="Daily Target Overrides"
          >
            <Sliders size={16} />
          </button>
          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-xl bg-obsidian-800 border border-obsidian-700/80 text-slate-300 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors"
            title="Database Backup & Settings"
          >
            <Database size={16} />
          </button>
          <button
            onClick={onResetSeed}
            className="p-2 rounded-xl bg-obsidian-800 border border-obsidian-700/80 text-slate-400 hover:text-accent-emerald hover:border-accent-emerald/40 transition-colors"
            title="Reset Demo Data"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
