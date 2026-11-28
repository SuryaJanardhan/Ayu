import React, { useState } from 'react';
import {
  X,
  Check,
  Trash2,
  Plus,
  UtensilsCrossed,
  Dumbbell,
  Activity,
  Flame,
  Zap,
  Wheat,
  Droplet,
  Droplets,
  Scale,
  Footprints,
  Moon,
  Heart,
  Clock,
  Repeat,
  Target,
} from 'lucide-react';
import {
  DailyBiometrics,
  DailyTargets,
  MealLog,
  WorkoutSession,
  WorkoutTemplate,
} from '../types';
import { db } from '../db';
import { getFoodImageFallback } from '../utils/imageOptimizer';

export type EditHubSection = 'meals' | 'train' | 'vitals';

interface EditHubModalProps {
  initialSection?: EditHubSection;
  currentDate: string;
  targets: DailyTargets;
  mealLogs: MealLog[];
  workoutSessions: WorkoutSession[];
  workoutTemplates: WorkoutTemplate[];
  biometrics?: DailyBiometrics;
  onClose: () => void;
  onRefresh: () => void;
}

const MEAL_TYPES: { id: MealLog['meal_type']; label: string }[] = [
  { id: 'breakfast', label: 'Brk' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Din' },
  { id: 'snack', label: 'Snack' },
];

const WORKOUT_CATEGORIES: { id: WorkoutTemplate['category']; label: string }[] = [
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'mobility', label: 'Mobility' },
];

export const EditHubModal: React.FC<EditHubModalProps> = ({
  initialSection = 'meals',
  currentDate,
  targets,
  mealLogs,
  workoutSessions,
  workoutTemplates,
  biometrics,
  onClose,
  onRefresh,
}) => {
  const [section, setSection] = useState<EditHubSection>(initialSection);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [mealDrafts, setMealDrafts] = useState<MealLog[]>(() => mealLogs.map((m) => ({ ...m })));
  const [newMealName, setNewMealName] = useState('');
  const [newMealCal, setNewMealCal] = useState('350');
  const [newMealPro, setNewMealPro] = useState('25');

  const [templateDrafts, setTemplateDrafts] = useState<WorkoutTemplate[]>(() =>
    workoutTemplates.map((t) => ({ ...t, exercises: t.exercises.map((e) => ({ ...e })) }))
  );
  const [sessionDrafts, setSessionDrafts] = useState<WorkoutSession[]>(() =>
    workoutSessions.map((s) => ({ ...s, exercises: s.exercises.map((e) => ({ ...e })) }))
  );
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateEx, setNewTemplateEx] = useState('Push-ups, Pull-ups, Planks');

  const [weight, setWeight] = useState(
    biometrics?.weight_kg !== undefined ? String(biometrics.weight_kg) : ''
  );
  const [steps, setSteps] = useState(
    biometrics?.steps !== undefined ? String(biometrics.steps) : ''
  );
  const [sleep, setSleep] = useState(
    biometrics?.sleep_hours !== undefined ? String(biometrics.sleep_hours) : ''
  );
  const [bpm, setBpm] = useState(
    biometrics?.resting_hr !== undefined ? String(biometrics.resting_hr) : ''
  );
  const [waterMl, setWaterMl] = useState(
    biometrics?.water_ml !== undefined ? String(biometrics.water_ml) : ''
  );

  const [calTarget, setCalTarget] = useState(String(targets.target_calories || 2200));
  const [proTarget, setProTarget] = useState(String(targets.target_protein_g || 160));
  const [carbTarget, setCarbTarget] = useState(String(targets.target_carbs_g || 220));
  const [fatTarget, setFatTarget] = useState(String(targets.target_fat_g || 70));
  const [waterTarget, setWaterTarget] = useState(String(targets.target_water_ml || 3000));

  const flash = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 1800);
  };

  const handleSaveMeal = async (meal: MealLog) => {
    if (!meal.id) return;
    await db.meal_logs.update(meal.id, {
      display_name: meal.display_name,
      meal_type: meal.meal_type,
      calories: Number(meal.calories) || 0,
      protein_g: Number(meal.protein_g) || 0,
      carbs_g: Number(meal.carbs_g) || 0,
      fat_g: Number(meal.fat_g) || 0,
    });
    onRefresh();
    flash('Saved');
  };

  const handleDeleteMeal = async (id?: number) => {
    if (!id) return;
    await db.meal_logs.delete(id);
    setMealDrafts((prev) => prev.filter((m) => m.id !== id));
    onRefresh();
    flash('Removed');
  };

  const handleAddMeal = async () => {
    const name = newMealName.trim();
    if (!name) return;
    const cal = Number(newMealCal) || 300;
    const pro = Number(newMealPro) || 20;
    const newEntry: MealLog = {
      date: currentDate,
      meal_type: 'lunch',
      raw_phrase: name,
      display_name: name,
      calories: cal,
      protein_g: pro,
      carbs_g: Math.round((cal * 0.4) / 4),
      fat_g: Math.round((cal * 0.25) / 9),
      logged_at: new Date().toISOString(),
      was_cached: false,
      image_url: getFoodImageFallback(name),
    };
    const id = await db.meal_logs.add(newEntry);
    setMealDrafts((prev) => [...prev, { ...newEntry, id }]);
    setNewMealName('');
    onRefresh();
    flash('Added');
  };

  const handleSaveTemplate = async (tmpl: WorkoutTemplate) => {
    await db.workout_templates.put(tmpl);
    onRefresh();
    flash('Saved');
  };

  const handleDeleteTemplate = async (id: string) => {
    await db.workout_templates.delete(id);
    setTemplateDrafts((prev) => prev.filter((t) => t.id !== id));
    onRefresh();
    flash('Deleted');
  };

  const handleAddTemplate = async () => {
    const name = newTemplateName.trim();
    if (!name) return;
    const exercises = newTemplateEx
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((ex) => ({ name: ex, target_sets: 3, default_reps: 10, default_weight_kg: 0 }));
    const tmpl: WorkoutTemplate = {
      id: `template-${Date.now()}`,
      name,
      category: 'strength',
      exercises,
    };
    await db.workout_templates.put(tmpl);
    setTemplateDrafts((prev) => [...prev, tmpl]);
    setNewTemplateName('');
    onRefresh();
    flash('Created');
  };

  const handleSaveSession = async (sess: WorkoutSession) => {
    if (!sess.id) return;
    await db.workout_sessions.update(sess.id, {
      name: sess.name,
      duration_minutes: Number(sess.duration_minutes) || 30,
      exercises: sess.exercises,
    });
    onRefresh();
    flash('Saved');
  };

  const handleDeleteSession = async (id?: number) => {
    if (!id) return;
    await db.workout_sessions.delete(id);
    setSessionDrafts((prev) => prev.filter((s) => s.id !== id));
    onRefresh();
    flash('Deleted');
  };

  const handleSaveVitalsAndTargets = async () => {
    const existingBio = await db.daily_biometrics.get(currentDate);
    await db.daily_biometrics.put({
      ...existingBio,
      date: currentDate,
      weight_kg: weight !== '' ? parseFloat(weight) : existingBio?.weight_kg,
      weight_is_manual: weight !== '' ? true : existingBio?.weight_is_manual ?? false,
      steps: steps !== '' ? parseInt(steps, 10) : existingBio?.steps,
      sleep_hours: sleep !== '' ? parseFloat(sleep) : existingBio?.sleep_hours,
      sleep_is_manual: sleep !== '' ? true : existingBio?.sleep_is_manual ?? false,
      resting_hr: bpm !== '' ? parseInt(bpm, 10) : existingBio?.resting_hr,
      water_ml: waterMl !== '' ? parseInt(waterMl, 10) : existingBio?.water_ml ?? 0,
      updated_at: new Date().toISOString(),
    });

    await db.daily_targets.put({
      date: currentDate,
      target_calories: parseInt(calTarget, 10) || 2200,
      target_protein_g: parseInt(proTarget, 10) || 160,
      target_carbs_g: parseInt(carbTarget, 10) || 220,
      target_fat_g: parseInt(fatTarget, 10) || 70,
      target_water_ml: parseInt(waterTarget, 10) || 3000,
      is_override: true,
    });

    onRefresh();
    flash('Saved');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] sm:max-w-md h-[88dvh] bg-cream-100 border-t sm:border border-cream-200 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-white border-b border-cream-200 flex items-center justify-between shrink-0">
          <div>
            <b className="text-lg font-extrabold text-ink">Edit All</b>
            <span className="text-xs text-ink-mute block font-mono">{currentDate}</span>
          </div>
          <div className="flex items-center gap-2">
            {statusMsg && (
              <span className="text-xs font-bold text-coral bg-coral-light px-3 py-1 rounded-full">
                {statusMsg}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-cream-100 text-ink-mute hover:text-ink"
              aria-label="Close editor"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="grid grid-cols-3 bg-white border border-cream-200 rounded-2xl p-1 gap-1">
            {[
              { id: 'meals' as EditHubSection, label: 'Meals', icon: UtensilsCrossed },
              { id: 'train' as EditHubSection, label: 'Train', icon: Dumbbell },
              { id: 'vitals' as EditHubSection, label: 'Vitals', icon: Activity },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  section === id ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 scrollbar-none">
          {section === 'meals' && (
            <>
              {/* Quick Add Meal with Column Labels */}
              <div className="bg-white rounded-2xl p-3.5 border border-cream-200 space-y-2">
                <div className="grid grid-cols-[1fr_64px_56px_38px] gap-1.5 text-xs font-bold text-ink-mute px-0.5">
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed size={13} className="text-coral" /> Meal
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame size={13} className="text-coral" /> Cal
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={13} className="text-sun" /> Pro
                  </span>
                  <span />
                </div>
                <div className="grid grid-cols-[1fr_64px_56px_38px] gap-1.5">
                  <input
                    type="text"
                    placeholder="Oats bowl"
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    className="bg-cream-100 border border-cream-200 rounded-xl px-2.5 py-2 text-sm text-ink"
                  />
                  <input
                    type="number"
                    value={newMealCal}
                    onChange={(e) => setNewMealCal(e.target.value)}
                    className="bg-cream-100 border border-cream-200 rounded-xl px-2 py-2 text-sm font-mono text-ink text-center"
                  />
                  <input
                    type="number"
                    value={newMealPro}
                    onChange={(e) => setNewMealPro(e.target.value)}
                    className="bg-cream-100 border border-cream-200 rounded-xl px-2 py-2 text-sm font-mono text-ink text-center"
                  />
                  <button
                    onClick={handleAddMeal}
                    className="rounded-xl bg-coral text-white flex items-center justify-center"
                    title="Add meal"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {mealDrafts.length === 0 ? (
                <div className="bg-white rounded-2xl p-5 border border-dashed border-cream-200 text-center text-sm text-ink-mute">
                  No meals logged
                </div>
              ) : (
                mealDrafts.map((meal, idx) => (
                  <div
                    key={meal.id ?? idx}
                    className="bg-white rounded-2xl p-3.5 border border-cream-200 space-y-2.5"
                  >
                    <input
                      type="text"
                      value={meal.display_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMealDrafts((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, display_name: val } : m))
                        );
                      }}
                      className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm font-bold text-ink"
                    />

                    {/* Custom Themed Pill Selector for Meal Type */}
                    <div className="grid grid-cols-4 gap-1 bg-cream-100 p-1 rounded-xl border border-cream-200">
                      {MEAL_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setMealDrafts((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, meal_type: t.id } : m))
                            )
                          }
                          className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            meal.meal_type === t.id
                              ? 'bg-coral text-white'
                              : 'text-ink-mute hover:text-ink'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Explicit Macro Column Labels with Icons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { label: 'Cal', key: 'calories', icon: Flame, color: 'text-coral' },
                          { label: 'Pro', key: 'protein_g', icon: Zap, color: 'text-coral' },
                          { label: 'Carb', key: 'carbs_g', icon: Wheat, color: 'text-sun' },
                          { label: 'Fat', key: 'fat_g', icon: Droplet, color: 'text-rose' },
                        ] as const
                      ).map(({ label, key, icon: Icon, color }) => (
                        <label key={key} className="block">
                          <span className="text-xs text-ink-mute font-bold flex items-center gap-1 mb-1">
                            <Icon size={12} className={color} /> {label}
                          </span>
                          <input
                            type="number"
                            value={meal[key]}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setMealDrafts((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, [key]: val } : m))
                              );
                            }}
                            className="w-full bg-cream-100 border border-cream-200 rounded-xl px-2 py-1.5 text-sm font-mono font-bold text-ink text-center"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose bg-rose-light flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                      <button
                        onClick={() => handleSaveMeal(meal)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-coral flex items-center gap-1"
                      >
                        <Check size={14} /> Save
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {section === 'train' && (
            <>
              {/* Add Routine Template */}
              <div className="bg-white rounded-2xl p-3.5 border border-cream-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-mute flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-coral" /> New Routine
                </span>
                <input
                  type="text"
                  placeholder="Routine name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Exercises (comma separated)"
                    value={newTemplateEx}
                    onChange={(e) => setNewTemplateEx(e.target.value)}
                    className="flex-1 bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink"
                  />
                  <button
                    onClick={handleAddTemplate}
                    className="px-3.5 rounded-xl bg-coral text-white text-sm font-bold flex items-center gap-1"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Workout Templates */}
              <span className="text-xs font-bold uppercase tracking-wider text-ink-mute block px-1">
                Routines ({templateDrafts.length})
              </span>
              {templateDrafts.map((tmpl, idx) => (
                <div
                  key={tmpl.id}
                  className="bg-white rounded-2xl p-3.5 border border-cream-200 space-y-2.5"
                >
                  <input
                    type="text"
                    value={tmpl.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTemplateDrafts((prev) =>
                        prev.map((t, i) => (i === idx ? { ...t, name: val } : t))
                      );
                    }}
                    className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm font-bold text-ink"
                  />

                  {/* Custom Themed Pill Selector for Category */}
                  <div className="grid grid-cols-3 gap-1 bg-cream-100 p-1 rounded-xl border border-cream-200">
                    {WORKOUT_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setTemplateDrafts((prev) =>
                            prev.map((t, i) => (i === idx ? { ...t, category: c.id } : t))
                          )
                        }
                        className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          tmpl.category === c.id
                            ? 'bg-coral text-white'
                            : 'text-ink-mute hover:text-ink'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Explicit Exercise Columns Header */}
                  <div className="grid grid-cols-[1fr_54px_54px] gap-1.5 text-xs font-bold text-ink-mute px-0.5 pt-1">
                    <span className="flex items-center gap-1">
                      <Dumbbell size={12} className="text-coral" /> Exercise
                    </span>
                    <span className="flex items-center justify-center gap-1">
                      <Repeat size={12} className="text-sun" /> Sets
                    </span>
                    <span className="flex items-center justify-center gap-1">
                      <Target size={12} className="text-sky" /> Reps
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {tmpl.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="grid grid-cols-[1fr_54px_54px] gap-1.5">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTemplateDrafts((prev) =>
                              prev.map((t, i) =>
                                i === idx
                                  ? {
                                      ...t,
                                      exercises: t.exercises.map((item, j) =>
                                        j === exIdx ? { ...item, name: val } : item
                                      ),
                                    }
                                  : t
                              )
                            );
                          }}
                          className="bg-cream-100 rounded-xl px-2.5 py-1.5 text-[13px] text-ink"
                        />
                        <input
                          type="number"
                          value={ex.target_sets}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 3;
                            setTemplateDrafts((prev) =>
                              prev.map((t, i) =>
                                i === idx
                                  ? {
                                      ...t,
                                      exercises: t.exercises.map((item, j) =>
                                        j === exIdx ? { ...item, target_sets: val } : item
                                      ),
                                    }
                                  : t
                              )
                            );
                          }}
                          className="bg-cream-100 rounded-xl px-1.5 py-1.5 text-[13px] font-mono font-bold text-center"
                        />
                        <input
                          type="number"
                          value={ex.default_reps}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 10;
                            setTemplateDrafts((prev) =>
                              prev.map((t, i) =>
                                i === idx
                                  ? {
                                      ...t,
                                      exercises: t.exercises.map((item, j) =>
                                        j === exIdx ? { ...item, default_reps: val } : item
                                      ),
                                    }
                                  : t
                              )
                            );
                          }}
                          className="bg-cream-100 rounded-xl px-1.5 py-1.5 text-[13px] font-mono font-bold text-center"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose bg-rose-light flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                    <button
                      onClick={() => handleSaveTemplate(tmpl)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-coral flex items-center gap-1"
                    >
                      <Check size={14} /> Save
                    </button>
                  </div>
                </div>
              ))}

              {/* Completed Sessions Today */}
              <span className="text-xs font-bold uppercase tracking-wider text-ink-mute block px-1 pt-1">
                Sessions ({sessionDrafts.length})
              </span>
              {sessionDrafts.length === 0 ? (
                <div className="bg-white rounded-2xl p-4 border border-dashed border-cream-200 text-center text-sm text-ink-mute">
                  No workouts logged
                </div>
              ) : (
                sessionDrafts.map((sess, idx) => (
                  <div
                    key={sess.id ?? idx}
                    className="bg-white rounded-2xl p-3.5 border border-cream-200 space-y-2.5"
                  >
                    <div className="grid grid-cols-[1fr_72px] gap-1.5 text-xs font-bold text-ink-mute px-0.5">
                      <span>Session</span>
                      <span className="flex items-center justify-center gap-1">
                        <Clock size={12} className="text-coral" /> Min
                      </span>
                    </div>
                    <div className="grid grid-cols-[1fr_72px] gap-1.5">
                      <input
                        type="text"
                        value={sess.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSessionDrafts((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, name: val } : s))
                          );
                        }}
                        className="bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm font-bold text-ink"
                      />
                      <input
                        type="number"
                        value={sess.duration_minutes}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 30;
                          setSessionDrafts((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, duration_minutes: val } : s))
                          );
                        }}
                        className="bg-cream-100 border border-cream-200 rounded-xl px-2 py-2 text-sm font-mono font-bold text-ink text-center"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDeleteSession(sess.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose bg-rose-light flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                      <button
                        onClick={() => handleSaveSession(sess)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-coral flex items-center gap-1"
                      >
                        <Check size={14} /> Save
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {section === 'vitals' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-3.5 border border-cream-200 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-mute block">
                  Vitals
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Weight (kg)', val: weight, set: setWeight, step: '0.1', icon: Scale, color: 'text-coral' },
                    { label: 'Steps', val: steps, set: setSteps, step: '100', icon: Footprints, color: 'text-sun' },
                    { label: 'Sleep (hrs)', val: sleep, set: setSleep, step: '0.1', icon: Moon, color: 'text-coral' },
                    { label: 'Heart (bpm)', val: bpm, set: setBpm, step: '1', icon: Heart, color: 'text-rose' },
                    { label: 'Water (ml)', val: waterMl, set: setWaterMl, step: '250', icon: Droplets, color: 'text-sky' },
                  ].map(({ label, val, set, step, icon: Icon, color }) => (
                    <label key={label} className="block">
                      <span className="text-xs font-bold text-ink-mute flex items-center gap-1 mb-1">
                        <Icon size={13} className={color} /> {label}
                      </span>
                      <input
                        type="number"
                        step={step}
                        placeholder="--"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-ink"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-cream-200 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-mute block">
                  Targets
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Calories', val: calTarget, set: setCalTarget, icon: Flame, color: 'text-coral' },
                    { label: 'Protein (g)', val: proTarget, set: setProTarget, icon: Zap, color: 'text-coral' },
                    { label: 'Carbs (g)', val: carbTarget, set: setCarbTarget, icon: Wheat, color: 'text-sun' },
                    { label: 'Fats (g)', val: fatTarget, set: setFatTarget, icon: Droplet, color: 'text-rose' },
                    { label: 'Water (ml)', val: waterTarget, set: setWaterTarget, icon: Droplets, color: 'text-sky' },
                  ].map(({ label, val, set, icon: Icon, color }) => (
                    <label key={label} className="block">
                      <span className="text-xs font-bold text-ink-mute flex items-center gap-1 mb-1">
                        <Icon size={13} className={color} /> {label}
                      </span>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-ink"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveVitalsAndTargets}
                className="w-full py-3.5 rounded-2xl bg-coral text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-card"
              >
                <Check size={17} />
                <span>Save All</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
