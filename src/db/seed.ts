import { db, createWeeklySnapshot } from './index';
import { getTodayDateString, shiftDate } from '../utils/date';
import { normalizeMealPhrase } from '../utils/normalizer';
import { getFoodImageFallback } from '../utils/imageOptimizer';

export async function initializeDatabaseSeed(force = false) {
  const existingTemplates = await db.workout_templates.count();
  if (existingTemplates > 0 && !force) {
    return;
  }

  const today = getTodayDateString();

  // 1. Seed Workout Templates
  await db.workout_templates.bulkPut([
    {
      id: 'template-push',
      name: 'Push Day (Chest, Shoulders, Triceps)',
      category: 'strength',
      exercises: [
        { name: 'Barbell Bench Press', target_sets: 4, default_reps: 8, default_weight_kg: 80 },
        { name: 'Incline Dumbbell Press', target_sets: 3, default_reps: 10, default_weight_kg: 28 },
        { name: 'Standing Overhead Press', target_sets: 3, default_reps: 8, default_weight_kg: 45 },
        { name: 'Triceps Cable Pushdown', target_sets: 3, default_reps: 12, default_weight_kg: 32 },
      ],
    },
    {
      id: 'template-pull',
      name: 'Pull Day (Back & Biceps)',
      category: 'strength',
      exercises: [
        { name: 'Barbell Deadlift', target_sets: 4, default_reps: 6, default_weight_kg: 120 },
        { name: 'Neutral Grip Pull-ups', target_sets: 3, default_reps: 10, default_weight_kg: 0 },
        { name: 'Chest Supported Row', target_sets: 3, default_reps: 10, default_weight_kg: 65 },
        { name: 'Incline Dumbbell Curl', target_sets: 3, default_reps: 12, default_weight_kg: 14 },
      ],
    },
    {
      id: 'template-legs',
      name: 'Leg Day (Quads & Posterior Chain)',
      category: 'strength',
      exercises: [
        { name: 'Barbell Back Squat', target_sets: 4, default_reps: 8, default_weight_kg: 100 },
        { name: 'Romanian Deadlift', target_sets: 3, default_reps: 10, default_weight_kg: 85 },
        { name: 'Walking Dumbbell Lunges', target_sets: 3, default_reps: 12, default_weight_kg: 20 },
        { name: 'Standing Calf Raises', target_sets: 4, default_reps: 15, default_weight_kg: 60 },
      ],
    },
    {
      id: 'template-cardio',
      name: 'Zone 2 Morning Run',
      category: 'cardio',
      exercises: [
        { name: 'Steady State Run (5km)', target_sets: 1, default_reps: 1, default_weight_kg: 0 },
      ],
    },
  ]);

  // 2. Seed Meal Cache with optimized images
  const seedMeals = [
    {
      display_name: '2 Eggs on Sourdough Toast',
      calories: 340,
      protein_g: 18,
      carbs_g: 32,
      fat_g: 14,
    },
    {
      display_name: 'Chicken Breast and White Rice 200g',
      calories: 520,
      protein_g: 48,
      carbs_g: 62,
      fat_g: 6,
    },
    {
      display_name: 'Whey Protein Shake with Banana',
      calories: 280,
      protein_g: 32,
      carbs_g: 28,
      fat_g: 3,
    },
    {
      display_name: 'Greek Yogurt with Blueberries and Honey',
      calories: 220,
      protein_g: 20,
      carbs_g: 26,
      fat_g: 4,
    },
  ];

  for (const meal of seedMeals) {
    const normalized = normalizeMealPhrase(meal.display_name);
    await db.meal_cache.put({
      normalized_phrase: normalized,
      display_name: meal.display_name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      hit_count: 5,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      image_url: getFoodImageFallback(meal.display_name),
    });
  }

  // 3. Seed Biometrics for past 7 days
  const weights = [74.6, 74.5, 74.3, 74.4, 74.1, 73.9, 73.8];
  const sleeps = [7.2, 6.8, 7.5, 8.0, 7.1, 6.9, 7.4];
  const stepsList = [8420, 10250, 9300, 11400, 7800, 10800, 9500];

  for (let i = 0; i < 7; i++) {
    const d = shiftDate(today, -6 + i);
    await db.daily_biometrics.put({
      date: d,
      weight_kg: weights[i],
      weight_is_manual: i === 6,
      sleep_hours: sleeps[i],
      sleep_is_manual: false,
      steps: stepsList[i],
      resting_hr: 58 + Math.floor(Math.random() * 5),
      water_ml: 2500 + i * 100,
      updated_at: new Date().toISOString(),
    });

    await db.daily_targets.put({
      date: d,
      target_calories: 2200,
      target_protein_g: 160,
      target_carbs_g: 220,
      target_fat_g: 70,
      target_water_ml: 3000,
      is_override: false,
    });
  }

  // Seed sample meal logs for today with image attachments
  await db.meal_logs.bulkPut([
    {
      date: today,
      meal_type: 'breakfast',
      raw_phrase: '2 eggs on sourdough toast',
      display_name: '2 Eggs on Sourdough Toast',
      calories: 340,
      protein_g: 18,
      carbs_g: 32,
      fat_g: 14,
      logged_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      was_cached: true,
      image_url: getFoodImageFallback('eggs toast'),
    },
    {
      date: today,
      meal_type: 'lunch',
      raw_phrase: 'chicken breast and white rice 200g',
      display_name: 'Chicken Breast and White Rice 200g',
      calories: 520,
      protein_g: 48,
      carbs_g: 62,
      fat_g: 6,
      logged_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      was_cached: true,
      image_url: getFoodImageFallback('chicken rice'),
    },
  ]);

  // Seed previous workout session
  const yesterday = shiftDate(today, -1);
  await db.workout_sessions.put({
    template_id: 'template-push',
    name: 'Push Day (Chest, Shoulders, Triceps)',
    date: yesterday,
    started_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
    duration_minutes: 52,
    rpe: 8,
    notes: 'Solid chest pump, increased bench weight.',
    exercises: [
      {
        name: 'Barbell Bench Press',
        sets: [
          { set_number: 1, weight_kg: 80, reps: 8, rpe: 7 },
          { set_number: 2, weight_kg: 82.5, reps: 8, rpe: 8 },
          { set_number: 3, weight_kg: 82.5, reps: 7, rpe: 9 },
        ],
      },
      {
        name: 'Incline Dumbbell Press',
        sets: [
          { set_number: 1, weight_kg: 28, reps: 10, rpe: 8 },
          { set_number: 2, weight_kg: 30, reps: 8, rpe: 9 },
        ],
      },
    ],
  });

  // Seed progress photos
  await db.progress_photos.bulkPut([
    {
      date: shiftDate(today, -30),
      label: 'Month 1 Check-in',
      weight_kg: 75.8,
      image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" rx="24" fill="%23C7D2FE"/><circle cx="100" cy="80" r="32" fill="%236366F1"/><path d="M50 240 Q100 150 150 240" fill="%234338CA"/></svg>',
      created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    },
    {
      date: today,
      label: 'Current Physique',
      weight_kg: 73.8,
      image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" rx="24" fill="%23FFE4D9"/><circle cx="100" cy="80" r="32" fill="%23FF5C35"/><path d="M55 240 Q100 160 145 240" fill="%23E04A25"/></svg>',
      created_at: new Date().toISOString(),
    },
  ]);

  // Seed an initial compressed weekly snapshot to demonstrate the 2-tier backup set
  await createWeeklySnapshot(`Weekly Baseline · ${shiftDate(today, -7)}`);
}
