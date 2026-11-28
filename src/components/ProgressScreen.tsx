import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Camera,
  TrendingDown,
  TrendingUp,
  User,
  Trash2,
  Check,
  Upload,
  Flame,
  Droplets,
  Dumbbell,
} from 'lucide-react';
import { DailyBiometrics, DailyTargets, MealLog, ProgressPhoto, WorkoutSession } from '../types';
import { db } from '../db';
import { compressImage } from '../utils/imageOptimizer';
import { getTodayDateString, shiftDate } from '../utils/date';

interface ProgressScreenProps {
  currentDate: string;
  biometrics?: DailyBiometrics;
  historicalWeights: { date: string; weight: number; moving_avg: number }[];
}

interface DayBucket {
  label: string;
  calories: number;
  waterL: number;
  workoutMin: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  currentDate,
  biometrics,
  historicalWeights,
}) => {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [bioList, setBioList] = useState<DailyBiometrics[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [target, setTarget] = useState<DailyTargets | undefined>(undefined);

  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Weekly Check-in');
  const [newWeight, setNewWeight] = useState(
    biometrics?.weight_kg ? String(biometrics.weight_kg) : ''
  );
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAllStats = async () => {
    const [photoRows, mealRows, bioRows, sessionRows, targetRow] = await Promise.all([
      db.progress_photos.orderBy('created_at').toArray(),
      db.meal_logs.toArray(),
      db.daily_biometrics.toArray(),
      db.workout_sessions.toArray(),
      db.daily_targets.get(currentDate),
    ]);
    setPhotos(photoRows);
    setMeals(mealRows);
    setBioList(bioRows);
    setSessions(sessionRows);
    setTarget(targetRow);
  };

  useEffect(() => {
    loadAllStats();
  }, [currentDate]);

  const buckets = useMemo<DayBucket[]>(() => {
    const daysCount = range === '7d' ? 7 : 30;
    const dates: string[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      dates.push(shiftDate(currentDate, -i));
    }

    const perDay = dates.map((d) => {
      const dayMeals = meals.filter((m) => m.date === d);
      const dayBio = bioList.find((b) => b.date === d);
      const dayWorkouts = sessions.filter((s) => s.date === d);
      return {
        date: d,
        label: d.slice(8),
        calories: dayMeals.reduce((sum, m) => sum + m.calories, 0),
        waterL: (dayBio?.water_ml || 0) / 1000,
        workoutMin: dayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
        protein: dayMeals.reduce((sum, m) => sum + m.protein_g, 0),
        carbs: dayMeals.reduce((sum, m) => sum + m.carbs_g, 0),
        fat: dayMeals.reduce((sum, m) => sum + m.fat_g, 0),
      };
    });

    if (range === '7d') {
      return perDay.map((d) => ({
        label: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' }),
        calories: d.calories,
        waterL: Number(d.waterL.toFixed(2)),
        workoutMin: d.workoutMin,
        protein: d.protein,
        carbs: d.carbs,
        fat: d.fat,
      }));
    }

    // Group 30 days into 5 buckets of 6 days for clean monthly bar comparison
    const grouped: DayBucket[] = [];
    for (let i = 0; i < perDay.length; i += 6) {
      const slice = perDay.slice(i, i + 6);
      const count = slice.length || 1;
      grouped.push({
        label: `${slice[0].date.slice(5)}`,
        calories: Math.round(slice.reduce((s, x) => s + x.calories, 0) / count),
        waterL: Number((slice.reduce((s, x) => s + x.waterL, 0) / count).toFixed(2)),
        workoutMin: slice.reduce((s, x) => s + x.workoutMin, 0),
        protein: Math.round(slice.reduce((s, x) => s + x.protein, 0) / count),
        carbs: Math.round(slice.reduce((s, x) => s + x.carbs, 0) / count),
        fat: Math.round(slice.reduce((s, x) => s + x.fat, 0) / count),
      });
    }
    return grouped;
  }, [range, currentDate, meals, bioList, sessions]);

  const targetCal = target?.target_calories || 2200;
  const targetWaterL = (target?.target_water_ml || 3000) / 1000;

  const avgCalories = Math.round(
    buckets.reduce((s, b) => s + b.calories, 0) / (buckets.length || 1)
  );
  const avgWater = (
    buckets.reduce((s, b) => s + b.waterL, 0) / (buckets.length || 1)
  ).toFixed(1);
  const totalWorkoutMin = buckets.reduce((s, b) => s + b.workoutMin, 0);
  const avgPro = Math.round(buckets.reduce((s, b) => s + b.protein, 0) / (buckets.length || 1));
  const avgCarb = Math.round(buckets.reduce((s, b) => s + b.carbs, 0) / (buckets.length || 1));
  const avgFat = Math.round(buckets.reduce((s, b) => s + b.fat, 0) / (buckets.length || 1));

  const maxCal = Math.max(targetCal * 1.15, ...buckets.map((b) => b.calories), 1);
  const maxWater = Math.max(targetWaterL * 1.15, ...buckets.map((b) => b.waterL), 1);
  const maxWorkout = Math.max(...buckets.map((b) => b.workoutMin), 45);

  const currentWeight = biometrics?.weight_kg;
  const recentWeights = useMemo(() => {
    return historicalWeights.slice(-(range === '7d' ? 7 : 30));
  }, [historicalWeights, range]);

  const weightDelta =
    recentWeights.length >= 2
      ? Number(
          (recentWeights[recentWeights.length - 1].weight - recentWeights[0].weight).toFixed(1)
        )
      : 0;

  const weightSvgPoints = useMemo(() => {
    const vals = recentWeights.map((w) => w.weight);
    const min = Math.min(...vals) - 0.5;
    const max = Math.max(...vals) + 0.5;
    const span = max - min || 1;
    return recentWeights
      .map((w, idx) => {
        const x = (idx / Math.max(recentWeights.length - 1, 1)) * 280;
        const y = 76 - ((w.weight - min) / span) * 62;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [recentWeights]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 600, 800, 0.75);
      setPreviewPhoto(compressed);
    } catch (err) {
      console.error('Photo optimization failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProgressPhoto = async () => {
    if (!previewPhoto) return;
    await db.progress_photos.add({
      date: getTodayDateString(),
      label: newLabel.trim() || 'Check-in',
      weight_kg: parseFloat(newWeight) || currentWeight,
      image_url: previewPhoto,
      created_at: new Date().toISOString(),
    });
    setPreviewPhoto(null);
    setShowAddModal(false);
    await loadAllStats();
  };

  const handleDeletePhoto = async (id?: number) => {
    if (!id) return;
    await db.progress_photos.delete(id);
    await loadAllStats();
  };

  const beforePhoto = photos[0];
  const afterPhoto = photos.length > 1 ? photos[photos.length - 1] : photos[0];

  return (
    <div className="flex flex-col gap-3.5 pb-2">
      {/* Header + Range Toggle */}
      <div className="flex justify-between items-center px-1">
        <b className="text-xl font-bold tracking-tight text-ink">Stats</b>
        <div className="flex bg-white border border-cream-200 rounded-xl p-0.5 shadow-xs text-xs font-semibold">
          <button
            onClick={() => setRange('7d')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              range === '7d' ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              range === '30d' ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Calories Intake Bar Chart */}
      <div className="bg-white rounded-3xl p-4 border border-cream-200 shadow-card">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <Flame size={15} className="text-coral" />
            <b className="text-xs font-bold uppercase tracking-wider text-ink-mute">
              Calorie Intake
            </b>
          </div>
          <span className="text-xs font-extrabold font-mono text-coral tabular-nums">
            avg {avgCalories} / {targetCal} kcal
          </span>
        </div>
        <div className="relative h-28 flex items-end gap-1.5 pt-4">
          <div
            className="absolute left-0 right-0 border-t border-dashed border-coral/40 pointer-events-none"
            style={{ bottom: `${Math.min((targetCal / maxCal) * 82, 82)}%` }}
          />
          {buckets.map((b, idx) => {
            const pct = b.calories > 0 ? Math.max(8, Math.round((b.calories / maxCal) * 100)) : 4;
            const calLabel =
              b.calories >= 1000 ? `${(b.calories / 1000).toFixed(1)}k` : String(b.calories);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-ink tabular-nums leading-none">
                  {calLabel}
                </span>
                <div className="w-full flex-1 flex items-end justify-center">
                  <div
                    className={`w-full max-w-[26px] rounded-t-lg transition-all duration-300 ${
                      b.calories === 0
                        ? 'bg-cream-200'
                        : b.calories > targetCal
                        ? 'bg-rose'
                        : 'bg-coral'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-ink-mute">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hydration Bar Chart */}
      <div className="bg-white rounded-3xl p-4 border border-cream-200 shadow-card">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <Droplets size={15} className="text-sky" />
            <b className="text-xs font-bold uppercase tracking-wider text-ink-mute">
              Hydration
            </b>
          </div>
          <span className="text-xs font-extrabold font-mono text-sky tabular-nums">
            avg {avgWater} / {targetWaterL.toFixed(1)} L
          </span>
        </div>
        <div className="relative h-24 flex items-end gap-1.5 pt-4">
          <div
            className="absolute left-0 right-0 border-t border-dashed border-sky/40 pointer-events-none"
            style={{ bottom: `${Math.min((targetWaterL / maxWater) * 82, 82)}%` }}
          />
          {buckets.map((b, idx) => {
            const pct = b.waterL > 0 ? Math.max(8, Math.round((b.waterL / maxWater) * 100)) : 4;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-ink tabular-nums leading-none">
                  {b.waterL > 0 ? b.waterL.toFixed(1) : '0'}
                </span>
                <div className="w-full flex-1 flex items-end justify-center">
                  <div
                    className={`w-full max-w-[26px] rounded-t-lg transition-all duration-300 ${
                      b.waterL === 0 ? 'bg-cream-200' : 'bg-sky'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-ink-mute">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Training Volume & Macro Averages */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-white rounded-3xl p-4 border border-cream-200 shadow-card">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5">
              <Dumbbell size={15} className="text-sun" />
              <b className="text-xs font-bold uppercase tracking-wider text-ink-mute">
                Training Volume
              </b>
            </div>
            <span className="text-xs font-extrabold font-mono text-sun tabular-nums">
              {totalWorkoutMin} min total
            </span>
          </div>
          <div className="h-20 flex items-end gap-1.5 pt-3">
            {buckets.map((b, idx) => {
              const pct = b.workoutMin > 0 ? Math.max(12, Math.round((b.workoutMin / maxWorkout) * 100)) : 5;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] font-mono font-bold text-ink tabular-nums leading-none">
                    {b.workoutMin > 0 ? `${b.workoutMin}m` : '0'}
                  </span>
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      className={`w-full max-w-[26px] rounded-t-lg transition-all duration-300 ${
                        b.workoutMin > 0 ? 'bg-sun' : 'bg-cream-200'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-ink-mute">{b.label}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-cream-200/70 text-center">
            <div className="bg-cream-100 rounded-xl py-1.5">
              <span className="text-[10px] text-ink-mute block">Avg Protein</span>
              <b className="text-xs font-mono text-ink">{avgPro}g</b>
            </div>
            <div className="bg-cream-100 rounded-xl py-1.5">
              <span className="text-[10px] text-ink-mute block">Avg Carbs</span>
              <b className="text-xs font-mono text-ink">{avgCarb}g</b>
            </div>
            <div className="bg-cream-100 rounded-xl py-1.5">
              <span className="text-[10px] text-ink-mute block">Avg Fat</span>
              <b className="text-xs font-mono text-ink">{avgFat}g</b>
            </div>
          </div>
        </div>
      </div>

      {/* Weight Trend Card */}
      <div className="bg-white rounded-3xl p-4 border border-cream-200 shadow-card">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-baseline gap-1">
            <b className="text-2xl font-extrabold text-ink tabular-nums">
              {currentWeight !== undefined ? currentWeight : '--'}
            </b>
            <small className="text-ink-mute text-xs font-medium">kg</small>
          </div>
          {recentWeights.length >= 2 && (
            <span className="text-coral font-bold text-xs flex items-center gap-0.5">
              {weightDelta <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg ({range})
            </span>
          )}
        </div>
        <div className="w-full mt-2">
          {recentWeights.length >= 2 ? (
            <svg viewBox="0 0 280 84" width="100%" className="overflow-visible">
              <polyline
                points={weightSvgPoints}
                fill="none"
                stroke="#FF5C35"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <div className="py-4 text-center text-xs text-ink-mute border border-dashed border-cream-200 rounded-2xl">
              Log at least 2 days of weight to see trend
            </div>
          )}
        </div>
      </div>

      {/* Before / After Photo Progression */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute">
            Before · After ({photos.length} photos)
          </h3>
          <span className="text-[10px] font-mono text-coral font-bold">Local Vault</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-40 rounded-3xl overflow-hidden bg-cream-100 border border-cream-200 relative flex items-center justify-center shadow-card">
            {beforePhoto ? (
              <img src={beforePhoto.image_url} alt={beforePhoto.label} className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-ink/30" />
            )}
            <em className="absolute bottom-2.5 left-2.5 bg-ink/80 backdrop-blur-xs text-white not-italic text-[10px] font-bold px-2 py-0.5 rounded-xl">
              {beforePhoto ? `${beforePhoto.date.slice(5)} · ${beforePhoto.weight_kg}kg` : 'Initial'}
            </em>
          </div>

          <div className="h-40 rounded-3xl overflow-hidden bg-cream-100 border border-cream-200 relative flex items-center justify-center shadow-card">
            {afterPhoto ? (
              <img src={afterPhoto.image_url} alt={afterPhoto.label} className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-coral/40" />
            )}
            <em className="absolute bottom-2.5 left-2.5 bg-coral text-white not-italic text-[10px] font-bold px-2 py-0.5 rounded-xl">
              {afterPhoto ? `Today · ${afterPhoto.weight_kg}kg` : 'Today'}
            </em>
            {photos.length > 2 && (
              <button
                onClick={() => handleDeletePhoto(afterPhoto?.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-ink/60 text-white hover:bg-rose transition-colors"
                title="Delete photo"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Progress Photo CTA */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-3 bg-coral-light hover:bg-coral text-coral hover:text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-card transition-all active:scale-[0.99]"
      >
        <Camera size={16} />
        <span>Add progress photo</span>
      </button>

      {/* Upload Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-cream-200 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
            <b className="text-base font-bold text-ink">Add Progress Photo</b>
            <div className="h-48 rounded-2xl bg-cream-100 border border-dashed border-cream-200 flex flex-col items-center justify-center relative overflow-hidden">
              {previewPhoto ? (
                <img src={previewPhoto} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <label className="flex flex-col items-center cursor-pointer p-4 text-center">
                  <Upload size={32} className="text-coral mb-2" />
                  <span className="text-xs font-bold text-ink">
                    {isUploading ? 'Optimizing photo...' : 'Select or Take Photo'}
                  </span>
                  <span className="text-[10px] text-ink-mute mt-1">Auto-downscaled WebP</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-ink-mute block mb-1">
                Check-in Label
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-1.5 text-xs text-ink font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-ink-mute block mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-1.5 text-xs text-ink font-mono font-bold"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setPreviewPhoto(null);
                  setShowAddModal(false);
                }}
                className="flex-1 py-2.5 bg-cream-100 text-ink-mute font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProgressPhoto}
                disabled={!previewPhoto}
                className="flex-1 py-2.5 bg-coral text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check size={14} />
                <span>Save to Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
