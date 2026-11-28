import { db } from './index';

/**
 * Initializes empty-state database structure without any dummy/mock user logs.
 * When force=true, clears all user-logged data so the user starts completely clean.
 */
export async function initializeDatabaseSeed(force = false) {
  if (force) {
    await Promise.all([
      db.meal_logs.clear(),
      db.meal_cache.clear(),
      db.daily_biometrics.clear(),
      db.daily_targets.clear(),
      db.workout_sessions.clear(),
      db.progress_photos.clear(),
      db.weekly_snapshots.clear(),
    ]);
  }

  const existingTemplates = await db.workout_templates.count();
  if (existingTemplates > 0 && !force) {
    return;
  }

  // Starter workout templates (structure only, zero logged sessions)
  await db.workout_templates.bulkPut([
    {
      id: 'template-push',
      name: 'Push Day',
      category: 'strength',
      exercises: [
        { name: 'Barbell Bench Press', target_sets: 4, default_reps: 8, default_weight_kg: 0 },
        { name: 'Incline Dumbbell Press', target_sets: 3, default_reps: 10, default_weight_kg: 0 },
        { name: 'Overhead Press', target_sets: 3, default_reps: 8, default_weight_kg: 0 },
      ],
    },
    {
      id: 'template-pull',
      name: 'Pull Day',
      category: 'strength',
      exercises: [
        { name: 'Barbell Deadlift', target_sets: 4, default_reps: 6, default_weight_kg: 0 },
        { name: 'Pull-ups', target_sets: 3, default_reps: 10, default_weight_kg: 0 },
        { name: 'Chest Supported Row', target_sets: 3, default_reps: 10, default_weight_kg: 0 },
      ],
    },
    {
      id: 'template-legs',
      name: 'Leg Day',
      category: 'strength',
      exercises: [
        { name: 'Barbell Back Squat', target_sets: 4, default_reps: 8, default_weight_kg: 0 },
        { name: 'Romanian Deadlift', target_sets: 3, default_reps: 10, default_weight_kg: 0 },
        { name: 'Walking Lunges', target_sets: 3, default_reps: 12, default_weight_kg: 0 },
      ],
    },
    {
      id: 'template-cardio',
      name: 'Zone 2 Cardio',
      category: 'cardio',
      exercises: [
        { name: 'Steady State Run', target_sets: 1, default_reps: 1, default_weight_kg: 0 },
      ],
    },
  ]);
}
