import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sliders, Settings, Edit3 } from 'lucide-react';
import { HomeScreen } from './components/HomeScreen';
import { MealsScreen } from './components/MealsScreen';
import { TrainScreen } from './components/TrainScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { SnapMealModal } from './components/SnapMealModal';
import { TargetOverrideModal } from './components/TargetOverrideModal';
import { WorkoutSessionModal } from './components/WorkoutSessionModal';
import { SettingsModal } from './components/SettingsModal';
import { EditBiometricsModal } from './components/EditBiometricsModal';
import { EditHubModal, EditHubSection } from './components/EditHubModal';
import { SplashScreen } from './components/SplashScreen';
import { db } from './db';
import { initializeDatabaseSeed } from './db/seed';
import { getTodayDateString, shiftDate } from './utils/date';
import { calculate7DayMovingAverage } from './utils/analytics';
import {
  MealLog,
  WorkoutSession,
  WorkoutTemplate,
  DailyTargets,
  DailyBiometrics,
} from './types';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
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
  const [isEditBioOpen, setIsEditBioOpen] = useState(false);
  const [editHubSection, setEditHubSection] = useState<EditHubSection | null>(null);
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

  const today = getTodayDateString();
  const isToday = currentDate === today;

  return (
    <div className="min-h-[100dvh] bg-[#F0EBE1] text-ink flex flex-col items-center sm:justify-center sm:py-6">
      {/* Fast Splash Screen on App Launch */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Mobile Frame Container (100dvh locked on mobile so top/bottom bars never move) */}
      <div className="w-full max-w-[430px] h-[100dvh] sm:max-w-[390px] sm:h-[844px] bg-cream-100 sm:border-[8px] sm:border-ink sm:rounded-[44px] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Fixed Top Utility Bar */}
        <header className="shrink-0 z-30 px-4 py-2.5 bg-cream-100/95 backdrop-blur-md border-b border-cream-200/70 flex items-center justify-between">
          <div className="flex items-center bg-white border border-cream-200 rounded-full px-1 py-0.5 shadow-xs">
            <button
              onClick={() => setCurrentDate(shiftDate(currentDate, -1))}
              className="p-1 text-ink-mute hover:text-ink"
              title="Previous Day"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentDate(today)}
              className="text-[11px] font-semibold text-ink px-2"
            >
              {isToday ? 'Today' : currentDate.slice(5)}
            </button>
            <button
              onClick={() => setCurrentDate(shiftDate(currentDate, 1))}
              className="p-1 text-ink-mute hover:text-ink"
              title="Next Day"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setEditHubSection(
                  activeTab === 'train' ? 'train' : activeTab === 'meals' ? 'meals' : 'vitals'
                )
              }
              className="p-2 rounded-full bg-white border border-cream-200 text-ink-mute hover:text-coral shadow-xs transition-colors"
              title="Edit All (Meals, Train, Vitals)"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="p-2 rounded-full bg-white border border-cream-200 text-ink-mute hover:text-coral shadow-xs transition-colors"
              title="Daily Targets"
            >
              <Sliders size={14} />
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center shadow-xs hover:opacity-90"
              title="Settings & Backup"
              aria-label="Settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* Scrollable Screen Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-3 pb-3 scrollbar-none">
          {activeTab === 'home' && (
            <HomeScreen
              currentDate={currentDate}
              targets={targets}
              mealLogs={mealLogs}
              biometrics={biometrics}
              historicalWeights={historicalWeights}
              onOpenEditBiometrics={() => setIsEditBioOpen(true)}
              onNavigateMeals={() => setActiveTab('meals')}
              onNavigateProgress={() => setActiveTab('progress')}
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

        {isEditBioOpen && (
          <EditBiometricsModal
            currentDate={currentDate}
            biometrics={biometrics}
            onClose={() => setIsEditBioOpen(false)}
            onRefresh={loadDashboardData}
          />
        )}

        {editHubSection && (
          <EditHubModal
            initialSection={editHubSection}
            currentDate={currentDate}
            targets={targets}
            mealLogs={mealLogs}
            workoutSessions={workoutSessions}
            workoutTemplates={workoutTemplates}
            biometrics={biometrics}
            onClose={() => setEditHubSection(null)}
            onRefresh={loadDashboardData}
          />
        )}
      </div>
    </div>
  );
};

export default App;
