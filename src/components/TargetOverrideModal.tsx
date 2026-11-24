import React, { useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-obsidian-900 border border-obsidian-700 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Target Overrides</h3>
            <span className="text-xs font-mono text-slate-400">Date: {currentDate}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-mono uppercase text-slate-400 block mb-1">
              Daily Calories (kcal)
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Carbs (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Fats (g)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono uppercase text-slate-400 block mb-1">
              Water Target (ml)
            </label>
            <input
              type="number"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {targets.is_override && (
            <button
              onClick={handleResetToDefault}
              className="p-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 text-xs flex items-center justify-center transition-colors"
              title="Reset to baseline"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            onClick={() => handleSave(true)}
            className="flex-1 py-2.5 bg-accent-amber hover:bg-amber-400 text-obsidian-950 font-bold rounded-xl text-xs transition-colors"
          >
            Save Target Override for Today
          </button>
        </div>
      </div>
    </div>
  );
};
