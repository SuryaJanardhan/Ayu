import React, { useState } from 'react';
import { Moon, Edit3, Check, Smartphone, User } from 'lucide-react';
import { DailyBiometrics } from '../types';
import { db } from '../db';

interface SleepCardProps {
  currentDate: string;
  biometrics?: DailyBiometrics;
  onRefresh: () => void;
}

export const SleepCard: React.FC<SleepCardProps> = ({
  currentDate,
  biometrics,
  onRefresh,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [sleepInput, setSleepInput] = useState(
    biometrics?.sleep_hours ? String(biometrics.sleep_hours) : '7.5'
  );

  const sleepHours = biometrics?.sleep_hours ?? 7.5;
  const isManual = biometrics?.sleep_is_manual ?? false;

  const handleSaveSleep = async () => {
    const parsed = parseFloat(sleepInput);
    if (isNaN(parsed) || parsed < 0) return;

    const existing = await db.daily_biometrics.get(currentDate);
    if (existing) {
      await db.daily_biometrics.update(currentDate, {
        sleep_hours: parsed,
        sleep_is_manual: true,
        updated_at: new Date().toISOString(),
      });
    } else {
      await db.daily_biometrics.put({
        date: currentDate,
        sleep_hours: parsed,
        sleep_is_manual: true,
        weight_is_manual: false,
        water_ml: 2000,
        updated_at: new Date().toISOString(),
      });
    }

    setIsEditing(false);
    onRefresh();
  };

  const sleepTarget = 8.0;
  const pct = Math.min(Math.round((sleepHours / sleepTarget) * 100), 100);

  return (
    <div className="bg-obsidian-800/90 border border-obsidian-700/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent-violet/10 border border-accent-violet/20 text-accent-violet">
            <Moon size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Sleep & Recovery</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isManual ? (
                <span className="text-[10px] font-mono text-accent-cyan flex items-center gap-1">
                  <User size={10} /> Manual Override Active
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Smartphone size={10} /> Native Sensor Synced
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                value={sleepInput}
                onChange={(e) => setSleepInput(e.target.value)}
                className="w-16 bg-obsidian-900 border border-accent-violet rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none"
              />
              <button
                onClick={handleSaveSleep}
                className="p-1 rounded-lg bg-accent-violet text-white font-bold"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <div className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
                  {sleepHours}h
                </div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  {pct}% of 8.0h target
                </span>
              </div>
              <button
                onClick={() => {
                  setSleepInput(String(sleepHours));
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-700 text-slate-400 hover:text-white transition-colors"
                title="Override Sleep Hours"
              >
                <Edit3 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sleep Bar */}
      <div className="h-2 w-full bg-obsidian-950 rounded-full overflow-hidden border border-obsidian-700/50 mb-3">
        <div
          className="h-full bg-gradient-to-r from-accent-indigo to-accent-violet transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Deep / REM restorative cycle logged</span>
        <span className="text-accent-violet font-semibold">Optimal Recovery</span>
      </div>
    </div>
  );
};
