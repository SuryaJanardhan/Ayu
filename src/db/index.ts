import Dexie, { Table } from 'dexie';
import {
  MealCacheItem,
  MealLog,
  WorkoutTemplate,
  WorkoutSession,
  DailyTargets,
  DailyBiometrics,
} from '../types';

export class AyuDatabase extends Dexie {
  meal_cache!: Table<MealCacheItem, string>;
  meal_logs!: Table<MealLog, number>;
  workout_templates!: Table<WorkoutTemplate, string>;
  workout_sessions!: Table<WorkoutSession, number>;
  daily_targets!: Table<DailyTargets, string>;
  daily_biometrics!: Table<DailyBiometrics, string>;

  constructor() {
    super('ayu_database');

    this.version(1).stores({
      meal_cache: '&normalized_phrase, last_used_at, hit_count',
      meal_logs: '++id, date, meal_type, logged_at',
      workout_templates: '&id, name, category',
      workout_sessions: '++id, template_id, date, started_at',
      daily_targets: '&date, is_override',
      daily_biometrics: '&date, updated_at',
    });
  }
}

export const db = new AyuDatabase();

export async function exportAyuDatabase() {
  const data = {
    version: 1,
    exported_at: new Date().toISOString(),
    meal_cache: await db.meal_cache.toArray(),
    meal_logs: await db.meal_logs.toArray(),
    workout_templates: await db.workout_templates.toArray(),
    workout_sessions: await db.workout_sessions.toArray(),
    daily_targets: await db.daily_targets.toArray(),
    daily_biometrics: await db.daily_biometrics.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAyuDatabase(jsonString: string) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || parsed.version !== 1) {
    throw new Error('Invalid or unsupported backup format.');
  }

  await db.transaction('rw', [
    db.meal_cache,
    db.meal_logs,
    db.workout_templates,
    db.workout_sessions,
    db.daily_targets,
    db.daily_biometrics,
  ], async () => {
    if (parsed.meal_cache) {
      await db.meal_cache.clear();
      await db.meal_cache.bulkPut(parsed.meal_cache);
    }
    if (parsed.meal_logs) {
      await db.meal_logs.clear();
      await db.meal_logs.bulkPut(parsed.meal_logs);
    }
    if (parsed.workout_templates) {
      await db.workout_templates.clear();
      await db.workout_templates.bulkPut(parsed.workout_templates);
    }
    if (parsed.workout_sessions) {
      await db.workout_sessions.clear();
      await db.workout_sessions.bulkPut(parsed.workout_sessions);
    }
    if (parsed.daily_targets) {
      await db.daily_targets.clear();
      await db.daily_targets.bulkPut(parsed.daily_targets);
    }
    if (parsed.daily_biometrics) {
      await db.daily_biometrics.clear();
      await db.daily_biometrics.bulkPut(parsed.daily_biometrics);
    }
  });
}
