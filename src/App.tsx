import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NutritionCard } from './components/NutritionCard';
import { WorkoutCard } from './components/WorkoutCard';
import { BiometricsCard } from './components/BiometricsCard';
import { SleepCard } from './components/SleepCard';
import { HydrationCard } from './components/HydrationCard';
import { TargetOverrideModal } from './components/TargetOverrideModal';
import { WorkoutSessionModal } from './components/WorkoutSessionModal';
import { SettingsModal } from './components/SettingsModal';
import { db } from './db';
import { initializeDatabaseSeed } from './db/seed';
import { getTodayDateString } from './utils/date';
import { calculate7DayMovingAverage } from './utils/analytics';
import {
  MealLog,
  WorkoutSession,
  WorkoutTemplate,
  DailyTargets,
  DailyBiometrics,
} from './types';

export const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [targets, setTargets] = useState<DailyTargets>({
    date: currentDate,
    target_calories: 2200,
    target_protein_g: 160,
    target_carbs_g: 220,
    target_fat_g: 70,
    target_water_ml: 3000,
    is_override: false,
  });
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [biometrics, setBiometrics] = useState<DailyBiometrics | undefined>(undefined);
  const [historicalWeights, setHistoricalWeights] = useState<
    { date: string; weight: number; moving_avg: number }[]
  >([]);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeWorkoutTemplate, setActiveWorkoutTemplate] = useState<WorkoutTemplate | undefined>(
    undefined
  );
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    const targetRec = await db.daily_targets.get(currentDate);
    if (targetRec) {
      setTargets(targetRec);
    } else {
      setTargets({
        date: currentDate,
        target_calories: 2200,
        target_protein_g: 160,
        target_carbs_g: 220,
        target_fat_g: 70,
        target_water_ml: 3000,
        is_override: false,
      });
    }

    const meals = await db.meal_logs.where('date').equals(currentDate).toArray();
    setMealLogs(meals);

    const workouts = await db.workout_sessions.where('date').equals(currentDate).toArray();
    setWorkoutSessions(workouts);

    const bio = await db.daily_biometrics.get(currentDate);
    setBiometrics(bio);

    const allBio = await db.daily_biometrics.toArray();
    const weightRecords = allBio
      .filter((b) => b.weight_kg !== undefined)
      .map((b) => ({ date: b.date, weight: b.weight_kg! }));

    const computed = calculate7DayMovingAverage(weightRecords);
    setHistoricalWeights(computed);
  }, [currentDate]);

  useEffect(() => {
    async function init() {
      await initializeDatabaseSeed();
      await loadDashboardData();
    }
    init();
  }, [loadDashboardData]);

  const handleOpenSessionModal = (template?: WorkoutTemplate) => {
    setActiveWorkoutTemplate(template);
    setIsWorkoutModalOpen(true);
  };

  const handleResetSeed = async () => {
    if (confirm('Reload seed data?')) {
      await initializeDatabaseSeed(true);
      await loadDashboardData();
    }
  };

  const totalCalories = mealLogs.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = mealLogs.reduce((sum, m) => sum + m.protein_g, 0);
  const currentWater = biometrics?.water_ml || 0;

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col items-center">
      {/* Mobile-optimized viewport wrapper */}
      <div className="w-full max-w-lg min-h-screen bg-slate-50/50 border-x border-slate-200/90 shadow-xl flex flex-col pb-12">
        <Header
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onOpenTargetModal={() => setIsTargetModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onResetSeed={handleResetSeed}
        />

        {/* Quick Telemetry Summary Bar */}
        <div className="px-4 pt-3 pb-1">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 grid grid-cols-3 gap-2 shadow-xs">
            <div>
              <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 block">Intake</span>
              <div className="text-sm font-extrabold font-mono text-slate-900 tabular-nums">
                {totalCalories} <span className="text-[10px] text-slate-500 font-normal">kcal</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 block">Protein</span>
              <div className="text-sm font-extrabold font-mono text-emerald-700 tabular-nums">
                {totalProtein} <span className="text-[10px] text-slate-500 font-normal">/ {targets.target_protein_g}g</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 block">Hydration</span>
              <div className="text-sm font-extrabold font-mono text-sky-700 tabular-nums">
                {currentWater} <span className="text-[10px] text-slate-500 font-normal">ml</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modular Cards List */}
        <main className="flex-1 px-4 py-3 space-y-4">
          <NutritionCard
            currentDate={currentDate}
            targets={targets}
            logs={mealLogs}
            onRefresh={loadDashboardData}
          />

          <WorkoutCard
            currentDate={currentDate}
            sessions={workoutSessions}
            onOpenSessionModal={handleOpenSessionModal}
            onRefresh={loadDashboardData}
          />

          <BiometricsCard
            currentDate={currentDate}
            biometrics={biometrics}
            historicalWeights={historicalWeights}
            onRefresh={loadDashboardData}
          />

          <SleepCard
            currentDate={currentDate}
            biometrics={biometrics}
            onRefresh={loadDashboardData}
          />

          <HydrationCard
            currentDate={currentDate}
            biometrics={biometrics}
            targets={targets}
            onRefresh={loadDashboardData}
          />
        </main>

        {/* Modals */}
        {isTargetModalOpen && (
          <TargetOverrideModal
            currentDate={currentDate}
            targets={targets}
            onClose={() => setIsTargetModalOpen(false)}
            onRefresh={loadDashboardData}
          />
        )}

        {isWorkoutModalOpen && (
          <WorkoutSessionModal
            currentDate={currentDate}
            template={activeWorkoutTemplate}
            onClose={() => setIsWorkoutModalOpen(false)}
            onRefresh={loadDashboardData}
          />
        )}

        {isSettingsModalOpen && (
          <SettingsModal
            onClose={() => setIsSettingsModalOpen(false)}
            onRefresh={loadDashboardData}
          />
        )}
      </div>
    </div>
  );
};

export default App;
