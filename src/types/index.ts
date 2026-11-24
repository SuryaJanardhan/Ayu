export interface MealCacheItem {
  normalized_phrase: string;
  display_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  hit_count: number;
  created_at: string;
  last_used_at: string;
}

export interface MealLog {
  id?: number;
  date: string; // YYYY-MM-DD
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  raw_phrase: string;
  display_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
  was_cached?: boolean;
}

export interface ExerciseSet {
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe?: number;
}

export interface WorkoutExercise {
  name: string;
  target_sets: number;
  sets: ExerciseSet[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'mobility';
  exercises: {
    name: string;
    target_sets: number;
    default_reps: number;
    default_weight_kg: number;
  }[];
}

export interface WorkoutSession {
  id?: number;
  template_id?: string;
  name: string;
  date: string; // YYYY-MM-DD
  started_at: string;
  completed_at: string;
  duration_minutes: number;
  rpe: number;
  notes?: string;
  exercises: {
    name: string;
    sets: ExerciseSet[];
  }[];
}

export interface DailyTargets {
  date: string; // YYYY-MM-DD
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  target_water_ml: number;
  is_override: boolean;
}

export interface DailyBiometrics {
  date: string; // YYYY-MM-DD
  weight_kg?: number;
  weight_is_manual: boolean;
  sleep_hours?: number;
  sleep_is_manual: boolean;
  steps?: number;
  resting_hr?: number;
  water_ml: number;
  updated_at: string;
}
