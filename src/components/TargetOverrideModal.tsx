import React, { useState } from 'react';
import { X, RotateCcw, Flame, Zap, Wheat, Droplet, Droplets, Check } from 'lucide-react';
import { DailyTargets } from '../types';
import { db } from '../db';

interface TargetOverrideModalProps {
  currentDate: string;
  targets: DailyTargets;
  onClose: () => void;
  onRefresh: () => void;
}

export const TargetOverrideModal: React.FC<TargetOverrideModalProps> = ({
  currentDate,
  targets,
  onClose,
  onRefresh,
}) => {
  const [calories, setCalories] = useState(String(targets.target_calories || 2200));
  const [protein, setProtein] = useState(String(targets.target_protein_g || 160));
  const [carbs, setCarbs] = useState(String(targets.target_carbs_g || 220));
  const [fat, setFat] = useState(String(targets.target_fat_g || 70));
  const [water, setWater] = useState(String(targets.target_water_ml || 3000));

  const handleSave = async (isOverride: boolean) => {
    await db.daily_targets.put({
      date: currentDate,
      target_calories: parseFloat(calories) || 2200,
      target_protein_g: parseFloat(protein) || 160,
      target_carbs_g: parseFloat(carbs) || 220,
      target_fat_g: parseFloat(fat) || 70,
      target_water_ml: parseFloat(water) || 3000,
      is_override: isOverride,
    });
    onRefresh();
    onClose();
  };

  const handleResetToDefault = async () => {
    await db.daily_targets.put({
      date: currentDate,
      target_calories: 2200,
      target_protein_g: 160,
      target_carbs_g: 220,
      target_fat_g: 70,
      target_water_ml: 3000,
      is_override: false,
    });
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-cream-100 border border-cream-200 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-ink">Targets</h3>
            <span className="text-xs font-mono text-ink-mute">{currentDate}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white border border-cream-200 text-ink-mute hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          {/* Calories */}
          <div className="bg-white rounded-2xl p-3 border border-cream-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-coral-light text-coral flex items-center justify-center">
                <Flame size={18} />
              </div>
              <div>
                <b className="text-sm font-bold text-ink block">Calories</b>
                <span className="text-xs text-ink-mute">kcal / day</span>
              </div>
            </div>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-24 bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-base text-right text-ink font-mono font-bold focus:border-coral focus:outline-none"
            />
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Protein', unit: 'g', val: protein, set: setProtein, icon: Zap, color: 'text-coral bg-coral-light' },
              { label: 'Carbs', unit: 'g', val: carbs, set: setCarbs, icon: Wheat, color: 'text-sun bg-sun-light' },
              { label: 'Fats', unit: 'g', val: fat, set: setFat, icon: Droplet, color: 'text-rose bg-rose-light' },
            ].map(({ label, unit, val, set, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl p-2.5 border border-cream-200 flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={15} />
                </div>
                <span className="text-xs font-bold text-ink">{label}</span>
                <div className="flex items-center gap-1 w-full">
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    className="w-full bg-cream-100 border border-cream-200 rounded-lg px-2 py-1.5 text-sm text-center text-ink font-mono font-bold focus:border-coral focus:outline-none"
                  />
                  <span className="text-xs text-ink-mute font-mono">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Water */}
          <div className="bg-white rounded-2xl p-3 border border-cream-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-light text-sky flex items-center justify-center">
                <Droplets size={18} />
              </div>
              <div>
                <b className="text-sm font-bold text-ink block">Hydration</b>
                <span className="text-xs text-ink-mute">ml / day</span>
              </div>
            </div>
            <input
              type="number"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="w-24 bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-base text-right text-ink font-mono font-bold focus:border-coral focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {targets.is_override && (
            <button
              onClick={handleResetToDefault}
              className="p-3 rounded-2xl bg-white border border-cream-200 hover:bg-cream-200 text-ink-mute hover:text-ink flex items-center justify-center transition-colors"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button
            onClick={() => handleSave(true)}
            className="flex-1 py-3 bg-coral hover:bg-coral-hover text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Check size={17} />
            <span>Save Targets</span>
          </button>
        </div>
      </div>
    </div>
  );
};
