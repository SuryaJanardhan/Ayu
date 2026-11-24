import React from 'react';
import { Footprints, Moon, Heart, ChevronLeft, ChevronRight, Sliders, Database, Check } from 'lucide-react';
import { DailyTargets, MealLog, DailyBiometrics } from '../types';
import { formatDateDisplay, getTodayDateString, shiftDate } from '../utils/date';
import { db } from '../db';

interface HomeScreenProps {
  currentDate: string;
  onDateChange: (d: string) => void;
  targets: DailyTargets;
  mealLogs: MealLog[];
  biometrics?: DailyBiometrics;
  historicalWeights: { date: string; weight: number; moving_avg: number }[];
  onOpenTargets: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentDate,
  onDateChange,
  targets,
  mealLogs,
  biometrics,
  historicalWeights,
  onOpenTargets,
  onOpenSettings,
  onRefresh,
}) => {
  const today = getTodayDateString();
  const isToday = currentDate === today;

  const totalCalories = mealLogs.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = mealLogs.reduce((sum, m) => sum + m.protein_g, 0);
  const totalCarbs = mealLogs.reduce((sum, m) => sum + m.carbs_g, 0);
  const totalFat = mealLogs.reduce((sum, m) => sum + m.fat_g, 0);

  const targetCal = targets.target_calories || 2200;
  const targetPro = targets.target_protein_g || 160;
  const targetCarb = targets.target_carbs_g || 220;
  const targetFat = targets.target_fat_g || 70;

  const calLeft = Math.max(0, targetCal - totalCalories);
  const calRatio = Math.min(totalCalories / targetCal, 1);
  const strokeDashoffset = 301 - 301 * calRatio;

  const proPct = Math.min(Math.round((totalProtein / targetPro) * 100), 100);
  const carbPct = Math.min(Math.round((totalCarbs / targetCarb) * 100), 100);
  const fatPct = Math.min(Math.round((totalFat / targetFat) * 100), 100);

  const currentWaterL = ((biometrics?.water_ml || 0) / 1000).toFixed(1);
  const targetWaterL = ((targets.target_water_ml || 3000) / 1000).toFixed(1);
  const isWaterGoalMet = (biometrics?.water_ml || 0) >= (targets.target_water_ml || 3000);

  const currentWeight = biometrics?.weight_kg || 73.8;
  const currentAvg = historicalWeights.find((w) => w.date === currentDate)?.moving_avg || 74.2;

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
    <div className="flex flex-col gap-3.5 pb-2">
      {/* Top Greeting Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <small className="text-ink-mute text-xs block font-medium">
            {formatDateDisplay(currentDate)}
          </small>
          <b className="text-xl font-bold tracking-tight text-ink">Hi Ayu</b>
        </div>

        <div className="flex items-center gap-2">
          {/* Date switcher pill */}
          <div className="flex items-center bg-white border border-cream-200 rounded-full px-1.5 py-0.5 shadow-xs">
            <button
              onClick={() => onDateChange(shiftDate(currentDate, -1))}
              className="p-1 text-ink-mute hover:text-ink"
              title="Previous Day"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-semibold text-ink px-1.5">
              {isToday ? 'Today' : currentDate.slice(5)}
            </span>
            <button
              onClick={() => onDateChange(shiftDate(currentDate, 1))}
              className="p-1 text-ink-mute hover:text-ink"
              title="Next Day"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            onClick={onOpenTargets}
            className="p-2 rounded-full bg-white border border-cream-200 text-ink-mute hover:text-coral shadow-xs transition-colors"
            title="Targets"
          >
            <Sliders size={14} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-white border border-cream-200 text-ink-mute hover:text-sky shadow-xs transition-colors"
            title="Settings & Backup"
          >
            <Database size={14} />
          </button>

          <div className="w-9 h-9 rounded-full bg-coral text-white font-bold flex items-center justify-center text-xs shadow-xs">
            AY
          </div>
        </div>
      </div>

      {/* Main Energy & Ring Card */}
      <div className="bg-white rounded-3xl p-4 border border-cream-200 shadow-card">
        <div className="flex items-center gap-4">
          {/* Calorie Gauge Ring */}
          <div className="relative flex-none">
            <svg width="118" height="118" viewBox="0 0 118 118">
              <circle
                cx="59"
                cy="59"
                r="48"
                fill="none"
                stroke="#F3E4D8"
                strokeWidth="11"
              />
              <circle
                cx="59"
                cy="59"
                r="48"
                fill="none"
                stroke="#FF5C35"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray="301"
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 59 59)"
                className="transition-all duration-700 ease-out"
              />
              <text
                x="59"
                y="58"
                textAnchor="middle"
                fontSize="22"
                fontWeight="800"
                fill="#1A1033"
                className="font-sans"
              >
                {totalCalories}
              </text>
              <text
                x="59"
                y="76"
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#7A6F8F"
                className="font-sans"
              >
                of {targetCal}
              </text>
            </svg>
          </div>

          {/* Calorie Remaining Callout */}
          <div className="flex-1">
            <div className="text-3xl font-extrabold tracking-tight text-coral leading-none tabular-nums">
              {calLeft}
            </div>
            <small className="text-ink-mute text-xs block font-medium mt-1">
              kcal remaining
            </small>
            <span className="text-[11px] font-mono font-semibold text-ink-light block mt-1">
              {totalCalories > targetCal ? 'Surplus recorded' : 'On track today'}
            </span>
          </div>
        </div>

        {/* Macro Bars */}
        <div className="grid grid-cols-3 gap-2 mt-3.5 pt-2 border-t border-cream-200/60">
          <div className="bg-cream-100 rounded-2xl p-2.5 text-center">
            <span className="text-[11px] text-ink-mute font-medium block">Protein</span>
            <b className="text-base text-ink block font-bold leading-tight tabular-nums">
              {totalProtein}/{targetPro}
            </b>
            <div className="h-1.5 rounded-full bg-cream-200 mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-coral transition-all duration-500"
                style={{ width: `${proPct}%` }}
              />
            </div>
          </div>

          <div className="bg-cream-100 rounded-2xl p-2.5 text-center">
            <span className="text-[11px] text-ink-mute font-medium block">Carbs</span>
            <b className="text-base text-ink block font-bold leading-tight tabular-nums">
              {totalCarbs}/{targetCarb}
            </b>
            <div className="h-1.5 rounded-full bg-cream-200 mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-sun transition-all duration-500"
                style={{ width: `${carbPct}%` }}
              />
            </div>
          </div>

          <div className="bg-cream-100 rounded-2xl p-2.5 text-center">
            <span className="text-[11px] text-ink-mute font-medium block">Fats</span>
            <b className="text-base text-ink block font-bold leading-tight tabular-nums">
              {totalFat}/{targetFat}
            </b>
            <div className="h-1.5 rounded-full bg-cream-200 mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose transition-all duration-500"
                style={{ width: `${fatPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Chips (Steps, Sleep, Heart Rate) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-sun-light rounded-2xl p-3 text-center flex flex-col items-center justify-center">
          <div className="text-sun font-bold mb-0.5">
            <Footprints size={18} />
          </div>
          <b className="text-base font-extrabold text-ink leading-tight tabular-nums">
            {biometrics?.steps ? `${(biometrics.steps / 1000).toFixed(1)}k` : '9.5k'}
          </b>
          <span className="text-[10px] text-ink-mute font-medium">steps</span>
        </div>

        <div className="bg-coral-light rounded-2xl p-3 text-center flex flex-col items-center justify-center">
          <div className="text-coral font-bold mb-0.5">
            <Moon size={18} />
          </div>
          <b className="text-base font-extrabold text-ink leading-tight tabular-nums">
            {biometrics?.sleep_hours ? `${biometrics.sleep_hours}h` : '7.4h'}
          </b>
          <span className="text-[10px] text-ink-mute font-medium">sleep</span>
        </div>

        <div className="bg-rose-light rounded-2xl p-3 text-center flex flex-col items-center justify-center">
          <div className="text-rose font-bold mb-0.5">
            <Heart size={18} />
          </div>
          <b className="text-base font-extrabold text-ink leading-tight tabular-nums">
            {biometrics?.resting_hr || 60}
          </b>
          <span className="text-[10px] text-ink-mute font-medium">bpm</span>
        </div>
      </div>

      {/* Water Hydration Card */}
      <div className="bg-white rounded-3xl p-4 border border-cream-200 shadow-card flex justify-between items-center">
        <div>
          <small className="text-ink-mute text-xs block font-medium">Hydration</small>
          <div className="text-xl font-extrabold text-ink leading-tight mt-0.5 flex items-center gap-1.5">
            <span>{currentWaterL} L</span>
            {isWaterGoalMet && (
              <span className="text-xs font-bold text-coral flex items-center gap-0.5">
                <Check size={13} strokeWidth={3} /> goal reached
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 font-mono text-xs font-bold">
          <button
            onClick={() => handleAddWater(250)}
            className="bg-sky-light text-sky hover:bg-sky hover:text-white px-3 py-2 rounded-xl transition-all"
          >
            +250
          </button>
          <button
            onClick={() => handleAddWater(500)}
            className="bg-sky-light text-sky hover:bg-sky hover:text-white px-3 py-2 rounded-xl transition-all"
          >
            +500
          </button>
        </div>
      </div>

      {/* Weight Summary Sparkline Card */}
      <div className="bg-white rounded-3xl p-4 border border-cream-200 shadow-card flex justify-between items-center">
        <div>
          <b className="text-sm font-bold text-ink block">Weight {currentWeight} kg</b>
          <small className="text-ink-mute text-xs font-medium">
            7-day avg {currentAvg} kg ↓
          </small>
        </div>

        <svg width="90" height="36" className="overflow-visible">
          <polyline
            points="0,10 15,14 30,12 45,18 60,20 75,24 90,26"
            fill="none"
            stroke="#FF5C35"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
