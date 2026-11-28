import React, { useState } from 'react';
import { X, Check, Trash2, Plus, UtensilsCrossed, Dumbbell, Activity } from 'lucide-react';
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

  // Meals editable drafts
  const [mealDrafts, setMealDrafts] = useState<MealLog[]>(() => mealLogs.map((m) => ({ ...m })));
  const [newMealName, setNewMealName] = useState('');
  const [newMealCal, setNewMealCal] = useState('350');
  const [newMealPro, setNewMealPro] = useState('25');

  // Train editable drafts
  const [templateDrafts, setTemplateDrafts] = useState<WorkoutTemplate[]>(() =>
    workoutTemplates.map((t) => ({ ...t, exercises: t.exercises.map((e) => ({ ...e })) }))
  );
  const [sessionDrafts, setSessionDrafts] = useState<WorkoutSession[]>(() =>
    workoutSessions.map((s) => ({ ...s, exercises: s.exercises.map((e) => ({ ...e })) }))
  );
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateEx, setNewTemplateEx] = useState('Push-ups, Pull-ups, Planks');

  // Vitals & Targets state (no fake defaults)
  const [weight, setWeight] = useState(biometrics?.weight_kg !== undefined ? String(biometrics.weight_kg) : '');
  const [steps, setSteps] = useState(biometrics?.steps !== undefined ? String(biometrics.steps) : '');
  const [sleep, setSleep] = useState(biometrics?.sleep_hours !== undefined ? String(biometrics.sleep_hours) : '');
  const [bpm, setBpm] = useState(biometrics?.resting_hr !== undefined ? String(biometrics.resting_hr) : '');
  const [waterMl, setWaterMl] = useState(biometrics?.water_ml !== undefined ? String(biometrics.water_ml) : '');

  const [calTarget, setCalTarget] = useState(String(targets.target_calories || 2200));
  const [proTarget, setProTarget] = useState(String(targets.target_protein_g || 160));
  const [carbTarget, setCarbTarget] = useState(String(targets.target_carbs_g || 220));
  const [fatTarget, setFatTarget] = useState(String(targets.target_fat_g || 70));
  const [waterTarget, setWaterTarget] = useState(String(targets.target_water_ml || 3000));

  const flash = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 1800);
  };

  // --- Meals handlers ---
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
    flash('Meal updated');
  };

  const handleDeleteMeal = async (id?: number) => {
    if (!id) return;
    await db.meal_logs.delete(id);
    setMealDrafts((prev) => prev.filter((m) => m.id !== id));
    onRefresh();
    flash('Meal removed');
  };

  const handleAddMeal = async () => {
    const name = newMealName.trim();
    if (!name) return;
    const cal = Number(newMealCal) || 300;
    const pro = Number(newMealPro) || 20;
    const id = await db.meal_logs.add({
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
    });
    setMealDrafts((prev) => [
      ...prev,
      {
        id,
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
      },
    ]);
    setNewMealName('');
    onRefresh();
    flash('Meal added');
  };

  // --- Train handlers ---
  const handleSaveTemplate = async (tmpl: WorkoutTemplate) => {
    await db.workout_templates.put(tmpl);
    onRefresh();
    flash('Routine updated');
  };

  const handleDeleteTemplate = async (id: string) => {
    await db.workout_templates.delete(id);
    setTemplateDrafts((prev) => prev.filter((t) => t.id !== id));
    onRefresh();
    flash('Routine deleted');
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
    flash('Routine created');
  };

  const handleSaveSession = async (sess: WorkoutSession) => {
    if (!sess.id) return;
    await db.workout_sessions.update(sess.id, {
      name: sess.name,
      duration_minutes: Number(sess.duration_minutes) || 30,
      exercises: sess.exercises,
    });
    onRefresh();
    flash('Session updated');
  };

  const handleDeleteSession = async (id?: number) => {
    if (!id) return;
    await db.workout_sessions.delete(id);
    setSessionDrafts((prev) => prev.filter((s) => s.id !== id));
    onRefresh();
    flash('Session deleted');
  };

  // --- Vitals & Targets handler ---
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
    flash('Vitals & targets saved');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm">
      <div className="w-full max-w-[430px] sm:max-w-md h-[88dvh] bg-cream-100 border-t sm:border border-cream-200 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
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

        {/* Scrollable Editor Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 scrollbar-none">
          {section === 'meals' && (
            <>
              {/* Quick Add Meal */}
              <div className="bg-white rounded-2xl p-3 border border-cream-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute block">
                  Add Meal
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Meal name (e.g. Oats bowl)"
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    className="flex-1 bg-cream-100 border border-cream-200 rounded-xl px-2.5 py-1.5 text-xs text-ink"
                  />
                  <input
                    type="number"
                    placeholder="kcal"
                    value={newMealCal}
                    onChange={(e) => setNewMealCal(e.target.value)}
                    className="w-16 bg-cream-100 border border-cream-200 rounded-xl px-2 py-1.5 text-xs font-mono text-ink"
                  />
                  <input
                    type="number"
                    placeholder="pro"
                    value={newMealPro}
                    onChange={(e) => setNewMealPro(e.target.value)}
                    className="w-14 bg-cream-100 border border-cream-200 rounded-xl px-2 py-1.5 text-xs font-mono text-ink"
                  />
                  <button
                    onClick={handleAddMeal}
                    className="px-2.5 rounded-xl bg-coral text-white flex items-center justify-center"
                    title="Add meal"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {mealDrafts.length === 0 ? (
                <div className="bg-white rounded-2xl p-5 border border-dashed border-cream-200 text-center text-xs text-ink-mute">
                  No meals logged for {currentDate}.
                </div>
              ) : (
                mealDrafts.map((meal, idx) => (
                  <div
                    key={meal.id ?? idx}
                    className="bg-white rounded-2xl p-3 border border-cream-200 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={meal.display_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMealDrafts((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, display_name: val } : m))
                          );
                        }}
                        className="flex-1 bg-cream-100 border border-cream-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink"
                      />
                      <select
                        value={meal.meal_type}
                        onChange={(e) => {
                          const val = e.target.value as MealLog['meal_type'];
                          setMealDrafts((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, meal_type: val } : m))
                          );
                        }}
                        className="bg-cream-100 border border-cream-200 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-ink"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                      {(
                        [
                          ['kcal', 'calories'],
                          ['P (g)', 'protein_g'],
                          ['C (g)', 'carbs_g'],
                          ['F (g)', 'fat_g'],
                        ] as const
                      ).map(([label, key]) => (
                        <label key={key} className="block">
                          <span className="text-ink-mute font-semibold block mb-0.5">{label}</span>
                          <input
                            type="number"
                            value={meal[key]}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setMealDrafts((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, [key]: val } : m))
                              );
                            }}
                            className="w-full bg-cream-100 border border-cream-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-ink"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose bg-rose-light flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                      <button
                        onClick={() => handleSaveMeal(meal)}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-coral flex items-center gap-1"
                      >
                        <Check size={12} /> Save
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
              <div className="bg-white rounded-2xl p-3 border border-cream-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute block">
                  New Workout Routine
                </span>
                <input
                  type="text"
                  placeholder="Routine name (e.g. Upper Body)"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full bg-cream-100 border border-cream-200 rounded-xl px-2.5 py-1.5 text-xs text-ink"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Exercises (comma separated)"
                    value={newTemplateEx}
                    onChange={(e) => setNewTemplateEx(e.target.value)}
                    className="flex-1 bg-cream-100 border border-cream-200 rounded-xl px-2.5 py-1.5 text-xs text-ink"
                  />
                  <button
                    onClick={handleAddTemplate}
                    className="px-3 rounded-xl bg-coral text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Workout Templates */}
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute block px-1">
                Routines ({templateDrafts.length})
              </span>
              {templateDrafts.map((tmpl, idx) => (
                <div
                  key={tmpl.id}
                  className="bg-white rounded-2xl p-3 border border-cream-200 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tmpl.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTemplateDrafts((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, name: val } : t))
                        );
                      }}
                      className="flex-1 bg-cream-100 border border-cream-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink"
                    />
                    <select
                      value={tmpl.category}
                      onChange={(e) => {
                        const val = e.target.value as WorkoutTemplate['category'];
                        setTemplateDrafts((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, category: val } : t))
                        );
                      }}
                      className="bg-cream-100 border border-cream-200 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-ink"
                    >
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                      <option value="mobility">Mobility</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    {tmpl.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="flex items-center gap-1.5">
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
                          className="flex-1 bg-cream-100 rounded-lg px-2 py-1 text-[11px] text-ink"
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
                          className="w-11 bg-cream-100 rounded-lg px-1.5 py-1 text-[11px] font-mono text-center"
                          title="Sets"
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
                          className="w-12 bg-cream-100 rounded-lg px-1.5 py-1 text-[11px] font-mono text-center"
                          title="Reps"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose bg-rose-light flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                    <button
                      onClick={() => handleSaveTemplate(tmpl)}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-coral flex items-center gap-1"
                    >
                      <Check size={12} /> Save
                    </button>
                  </div>
                </div>
              ))}

              {/* Completed Sessions Today */}
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute block px-1 pt-1">
                Logged Sessions ({sessionDrafts.length})
              </span>
              {sessionDrafts.length === 0 ? (
                <div className="bg-white rounded-2xl p-4 border border-dashed border-cream-200 text-center text-xs text-ink-mute">
                  No completed workouts logged for {currentDate}.
                </div>
              ) : (
                sessionDrafts.map((sess, idx) => (
                  <div
                    key={sess.id ?? idx}
                    className="bg-white rounded-2xl p-3 border border-cream-200 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sess.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSessionDrafts((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, name: val } : s))
                          );
                        }}
                        className="flex-1 bg-cream-100 border border-cream-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink"
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
                        className="w-16 bg-cream-100 border border-cream-200 rounded-xl px-2 py-1.5 text-xs font-mono text-ink"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDeleteSession(sess.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose bg-rose-light flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                      <button
                        onClick={() => handleSaveSession(sess)}
                        className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-coral flex items-center gap-1"
                      >
                        <Check size={12} /> Save
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute block">
                  Daily Vitals
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Weight (kg)', weight, setWeight, '0.1'],
                    ['Steps', steps, setSteps, '100'],
                    ['Sleep (hrs)', sleep, setSleep, '0.1'],
                    ['Resting HR (bpm)', bpm, setBpm, '1'],
                    ['Water (ml)', waterMl, setWaterMl, '250'],
                  ].map(([label, val, setter, step]) => (
                    <label key={label as string} className="block">
                      <span className="text-xs font-bold text-ink-mute block mb-1">
                        {label as string}
                      </span>
                      <input
                        type="number"
                        step={step as string}
                        placeholder="--"
                        value={val as string}
                        onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                        className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-ink"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-cream-200 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-mute block">
                  Daily Targets
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Calories (kcal)', calTarget, setCalTarget],
                    ['Protein (g)', proTarget, setProTarget],
                    ['Carbs (g)', carbTarget, setCarbTarget],
                    ['Fat (g)', fatTarget, setFatTarget],
                    ['Water Goal (ml)', waterTarget, setWaterTarget],
                  ].map(([label, val, setter]) => (
                    <label key={label as string} className="block">
                      <span className="text-xs font-bold text-ink-mute block mb-1">
                        {label as string}
                      </span>
                      <input
                        type="number"
                        value={val as string}
                        onChange={(e) => (setter as (v: string) => void)(e.target.value)}
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
                <span>Save All Vitals & Targets</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
