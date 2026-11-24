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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100 text-telemetry-violet">
            <Moon size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Sleep & Recovery</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isManual ? (
                <span className="text-[10px] font-mono font-semibold text-brand-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <User size={10} /> Manual Override Active
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
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
                className="w-16 bg-white border border-violet-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono font-bold text-center focus:outline-none shadow-xs"
              />
              <button
                onClick={handleSaveSleep}
                className="p-1 rounded-lg bg-violet-600 text-white font-bold shadow-xs hover:bg-violet-700"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <div className="text-xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
                  {sleepHours}h
                </div>
                <span className="text-[11px] font-mono text-slate-500 block">
                  {pct}% of 8.0h target
                </span>
              </div>
              <button
                onClick={() => {
                  setSleepInput(String(sleepHours));
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
                title="Override Sleep Hours"
              >
                <Edit3 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/70 mb-3">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
        <span>Deep & REM cycle duration recorded</span>
        <span className="text-violet-700 font-bold">Optimal Recovery</span>
      </div>
    </div>
  );
};
