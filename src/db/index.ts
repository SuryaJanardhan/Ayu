import Dexie, { Table } from 'dexie';
import {
  MealCacheItem,
  MealLog,
  WorkoutTemplate,
  WorkoutSession,
  DailyTargets,
  DailyBiometrics,
  ProgressPhoto,
  WeeklySnapshot,
} from '../types';
import { compressSnapshotData, decompressSnapshotData } from '../utils/compression';
import { getTodayDateString } from '../utils/date';

export class AyuDatabase extends Dexie {
  meal_cache!: Table<MealCacheItem, string>;
  meal_logs!: Table<MealLog, number>;
  workout_templates!: Table<WorkoutTemplate, string>;
  workout_sessions!: Table<WorkoutSession, number>;
  daily_targets!: Table<DailyTargets, string>;
  daily_biometrics!: Table<DailyBiometrics, string>;
  progress_photos!: Table<ProgressPhoto, number>;
  weekly_snapshots!: Table<WeeklySnapshot, number>;

  constructor() {
    super('ayu_database');

    this.version(2).stores({
      meal_cache: '&normalized_phrase, last_used_at, hit_count',
      meal_logs: '++id, date, meal_type, logged_at',
      workout_templates: '&id, name, category',
      workout_sessions: '++id, template_id, date, started_at',
      daily_targets: '&date, is_override',
      daily_biometrics: '&date, updated_at',
      progress_photos: '++id, date, created_at',
      weekly_snapshots: '++id, snapshot_date, created_at',
    });
  }
}

export const db = new AyuDatabase();

/**
 * Creates a safely compressed weekly snapshot of the main working set.
 * Compresses all active tables (including embedded images) via Gzip streams.
 */
export async function createWeeklySnapshot(customLabel?: string): Promise<WeeklySnapshot> {
  const mainWorkingData = {
    version: 2,
    exported_at: new Date().toISOString(),
    meal_cache: await db.meal_cache.toArray(),
    meal_logs: await db.meal_logs.toArray(),
    workout_templates: await db.workout_templates.toArray(),
    workout_sessions: await db.workout_sessions.toArray(),
    daily_targets: await db.daily_targets.toArray(),
    daily_biometrics: await db.daily_biometrics.toArray(),
    progress_photos: await db.progress_photos.toArray(),
  };

  const compression = await compressSnapshotData(mainWorkingData);
  const today = getTodayDateString();
  const label = customLabel || `Weekly Snapshot · ${today}`;

  const snapshot: WeeklySnapshot = {
    snapshot_date: today,
    week_label: label,
    compressed_data: compression.compressedData,
    original_bytes: compression.originalBytes,
    compressed_bytes: compression.compressedBytes,
    ratio_percent: compression.ratioPercent,
    created_at: new Date().toISOString(),
  };

  const id = await db.weekly_snapshots.add(snapshot);
  snapshot.id = id;
  return snapshot;
}

/**
 * Restores a compressed weekly snapshot into the main active working set.
 */
export async function restoreWeeklySnapshot(snapshotId: number): Promise<void> {
  const snapshot = await db.weekly_snapshots.get(snapshotId);
  if (!snapshot) {
    throw new Error('Snapshot record not found.');
  }

  const decompressed = await decompressSnapshotData(snapshot.compressed_data);
  if (!decompressed || decompressed.version !== 2) {
    throw new Error('Corrupted or incompatible snapshot payload.');
  }

  await db.transaction(
    'rw',
    [
      db.meal_cache,
      db.meal_logs,
      db.workout_templates,
      db.workout_sessions,
      db.daily_targets,
      db.daily_biometrics,
      db.progress_photos,
    ],
    async () => {
      if (decompressed.meal_cache) {
        await db.meal_cache.clear();
        await db.meal_cache.bulkPut(decompressed.meal_cache);
      }
      if (decompressed.meal_logs) {
        await db.meal_logs.clear();
        await db.meal_logs.bulkPut(decompressed.meal_logs);
      }
      if (decompressed.workout_templates) {
        await db.workout_templates.clear();
        await db.workout_templates.bulkPut(decompressed.workout_templates);
      }
      if (decompressed.workout_sessions) {
        await db.workout_sessions.clear();
        await db.workout_sessions.bulkPut(decompressed.workout_sessions);
      }
      if (decompressed.daily_targets) {
        await db.daily_targets.clear();
        await db.daily_targets.bulkPut(decompressed.daily_targets);
      }
      if (decompressed.daily_biometrics) {
        await db.daily_biometrics.clear();
        await db.daily_biometrics.bulkPut(decompressed.daily_biometrics);
      }
      if (decompressed.progress_photos) {
        await db.progress_photos.clear();
        await db.progress_photos.bulkPut(decompressed.progress_photos);
      }
    }
  );
}

/**
 * Computes storage telemetry statistics for the main working set.
 */
export async function getMainStorageTelemetry() {
  const meals = await db.meal_logs.toArray();
  const photos = await db.progress_photos.toArray();
  const snapshots = await db.weekly_snapshots.toArray();

  let totalEstimatedBytes = 0;
  let imageAttachments = 0;

  for (const m of meals) {
    totalEstimatedBytes += (m.display_name?.length || 0) * 2 + 100;
    if (m.image_url) {
      totalEstimatedBytes += m.image_url.length;
      imageAttachments++;
    }
  }

  for (const p of photos) {
    totalEstimatedBytes += (p.image_url?.length || 0);
    imageAttachments++;
  }

  const snapshotBytes = snapshots.reduce((sum, s) => sum + s.compressed_bytes, 0);

  return {
    mainBytes: totalEstimatedBytes + 5000,
    snapshotBytes,
    imageAttachments,
    snapshotCount: snapshots.length,
  };
}

export async function exportAyuDatabase() {
  const data = {
    version: 2,
    exported_at: new Date().toISOString(),
    meal_cache: await db.meal_cache.toArray(),
    meal_logs: await db.meal_logs.toArray(),
    workout_templates: await db.workout_templates.toArray(),
    workout_sessions: await db.workout_sessions.toArray(),
    daily_targets: await db.daily_targets.toArray(),
    daily_biometrics: await db.daily_biometrics.toArray(),
    progress_photos: await db.progress_photos.toArray(),
    weekly_snapshots: await db.weekly_snapshots.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAyuDatabase(jsonString: string) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || (parsed.version !== 1 && parsed.version !== 2)) {
    throw new Error('Invalid or unsupported backup format.');
  }

  await db.transaction(
    'rw',
    [
      db.meal_cache,
      db.meal_logs,
      db.workout_templates,
      db.workout_sessions,
      db.daily_targets,
      db.daily_biometrics,
      db.progress_photos,
      db.weekly_snapshots,
    ],
    async () => {
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
      if (parsed.progress_photos) {
        await db.progress_photos.clear();
        await db.progress_photos.bulkPut(parsed.progress_photos);
      }
      if (parsed.weekly_snapshots) {
        await db.weekly_snapshots.clear();
        await db.weekly_snapshots.bulkPut(parsed.weekly_snapshots);
      }
    }
  );
}
