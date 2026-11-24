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

  // Modals state
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeWorkoutTemplate, setActiveWorkoutTemplate] = useState<WorkoutTemplate | undefined>(
    undefined
  );
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

  // Initialize DB and load data
  const loadDashboardData = useCallback(async () => {
    // Targets
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

    // Meal Logs
    const meals = await db.meal_logs.where('date').equals(currentDate).toArray();
    setMealLogs(meals);

    // Workout Sessions
    const workouts = await db.workout_sessions.where('date').equals(currentDate).toArray();
    setWorkoutSessions(workouts);

    // Biometrics for current date
    const bio = await db.daily_biometrics.get(currentDate);
    setBiometrics(bio);

    // Historical weights for 7-day trend
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

  // Aggregates for top quick telemetry bar
  const totalCalories = mealLogs.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = mealLogs.reduce((sum, m) => sum + m.protein_g, 0);
  const currentWater = biometrics?.water_ml || 0;

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col items-center">
      {/* Mobile-optimized viewport wrapper */}
      <div className="w-full max-w-lg min-h-screen bg-obsidian-900 border-x border-obsidian-700/60 shadow-2xl flex flex-col pb-12">
        <Header
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onOpenTargetModal={() => setIsTargetModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onResetSeed={handleResetSeed}
        />

        {/* Quick Telemetry Summary Bar */}
        <div className="px-4 pt-3 pb-1">
          <div className="bg-obsidian-950/80 border border-obsidian-700/60 rounded-xl p-3 grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Intake</span>
              <div className="text-sm font-bold font-mono text-white tabular-nums">
                {totalCalories} <span className="text-[10px] text-slate-400 font-normal">kcal</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Protein</span>
              <div className="text-sm font-bold font-mono text-accent-emerald tabular-nums">
                {totalProtein} <span className="text-[10px] text-slate-400 font-normal">/ {targets.target_protein_g}g</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Hydration</span>
              <div className="text-sm font-bold font-mono text-accent-cyan tabular-nums">
                {currentWater} <span className="text-[10px] text-slate-400 font-normal">ml</span>
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
