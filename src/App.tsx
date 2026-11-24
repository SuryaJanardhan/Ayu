import React, { useState, useEffect, useCallback } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { MealsScreen } from './components/MealsScreen';
import { TrainScreen } from './components/TrainScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { SnapMealModal } from './components/SnapMealModal';
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
  const [activeTab, setActiveTab] = useState<TabType>('home');
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
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [biometrics, setBiometrics] = useState<DailyBiometrics | undefined>(undefined);
  const [historicalWeights, setHistoricalWeights] = useState<
    { date: string; weight: number; moving_avg: number }[]
  >([]);

  // Modals state
  const [isQuickSnapOpen, setIsQuickSnapOpen] = useState(false);
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

    const tmpls = await db.workout_templates.toArray();
    setWorkoutTemplates(tmpls);

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

  return (
    <div className="min-h-screen bg-[#F0EBE1] text-ink flex flex-col items-center justify-center sm:py-6">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-[390px] h-[844px] bg-cream-100 sm:border-[8px] sm:border-ink sm:rounded-[44px] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Scrollable Screen Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-3 scrollbar-none">
          {activeTab === 'home' && (
            <HomeScreen
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              targets={targets}
              mealLogs={mealLogs}
              biometrics={biometrics}
              historicalWeights={historicalWeights}
              onOpenTargets={() => setIsTargetModalOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onRefresh={loadDashboardData}
            />
          )}

          {activeTab === 'meals' && (
            <MealsScreen
              currentDate={currentDate}
              mealLogs={mealLogs}
              onOpenQuickSnap={() => setIsQuickSnapOpen(true)}
              onRefresh={loadDashboardData}
            />
          )}

          {activeTab === 'train' && (
            <TrainScreen
              currentDate={currentDate}
              sessions={workoutSessions}
              templates={workoutTemplates}
              onOpenSessionModal={handleOpenSessionModal}
              onRefresh={loadDashboardData}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressScreen
              currentDate={currentDate}
              biometrics={biometrics}
              historicalWeights={historicalWeights}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenQuickSnap={() => setIsQuickSnapOpen(true)}
        />

        {/* Modals & Sheets */}
        {isQuickSnapOpen && (
          <SnapMealModal
            currentDate={currentDate}
            onClose={() => setIsQuickSnapOpen(false)}
            onRefresh={loadDashboardData}
          />
        )}

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
