import React from 'react';
import { Droplets, Plus } from 'lucide-react';
import { DailyBiometrics, DailyTargets } from '../types';
import { db } from '../db';

interface HydrationCardProps {
  currentDate: string;
  biometrics?: DailyBiometrics;
  targets: DailyTargets;
  onRefresh: () => void;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({
  currentDate,
  biometrics,
  targets,
  onRefresh,
}) => {
  const currentWater = biometrics?.water_ml ?? 0;
  const targetWater = targets.target_water_ml || 3000;
  const pct = Math.min(Math.round((currentWater / targetWater) * 100), 100);

  const handleAddWater = async (amount: number) => {
    const existing = await db.daily_biometrics.get(currentDate);
    if (existing) {
      await db.daily_biometrics.update(currentDate, {
        water_ml: (existing.water_ml || 0) + amount,
        updated_at: new Date().toISOString(),
      });
    } else {
      await db.daily_biometrics.put({
        date: currentDate,
        water_ml: amount,
        weight_is_manual: false,
        sleep_is_manual: false,
        updated_at: new Date().toISOString(),
      });
    }
    onRefresh();
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-telemetry-sky">
            <Droplets size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Daily Hydration</h2>
            <span className="text-[11px] font-mono text-slate-500">Target {targetWater} ml</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
            {currentWater}
            <span className="text-xs font-normal text-slate-500"> / {targetWater} ml</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-sky-700">{pct}% completed</span>
        </div>
      </div>

      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/70 mb-4">
        <div
          className="h-full bg-sky-500 transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleAddWater(250)}
          className="py-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-mono font-bold text-slate-700 hover:text-sky-800 flex items-center justify-center gap-1 transition-colors shadow-xs"
        >
          <Plus size={12} />
          <span>+250 ml</span>
        </button>
        <button
          onClick={() => handleAddWater(500)}
          className="py-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-mono font-bold text-slate-700 hover:text-sky-800 flex items-center justify-center gap-1 transition-colors shadow-xs"
        >
          <Plus size={12} />
          <span>+500 ml</span>
        </button>
        <button
          onClick={() => handleAddWater(750)}
          className="py-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-mono font-bold text-slate-700 hover:text-sky-800 flex items-center justify-center gap-1 transition-colors shadow-xs"
        >
          <Plus size={12} />
          <span>+750 ml</span>
        </button>
      </div>
    </div>
  );
};
