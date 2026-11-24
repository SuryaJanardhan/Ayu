import React, { useState, useEffect } from 'react';
import { Utensils, Zap, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { MealLog, MealCacheItem, DailyTargets } from '../types';
import { db } from '../db';
import { normalizeMealPhrase } from '../utils/normalizer';

interface NutritionCardProps {
  currentDate: string;
  targets: DailyTargets;
  logs: MealLog[];
  onRefresh: () => void;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  currentDate,
  targets,
  logs,
  onRefresh,
}) => {
  const [inputPhrase, setInputPhrase] = useState('');
  const [cacheSuggestions, setCacheSuggestions] = useState<MealCacheItem[]>([]);
  const [exactMatch, setExactMatch] = useState<MealCacheItem | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [recentCacheItems, setRecentCacheItems] = useState<MealCacheItem[]>([]);

  useEffect(() => {
    db.meal_cache
      .orderBy('last_used_at')
      .reverse()
      .limit(6)
      .toArray()
      .then(setRecentCacheItems);
  }, [logs]);

  useEffect(() => {
    const normalized = normalizeMealPhrase(inputPhrase);
    if (!normalized) {
      setExactMatch(null);
      setCacheSuggestions([]);
      return;
    }

    db.meal_cache.get(normalized).then((cached) => {
      setExactMatch(cached || null);
    });

    db.meal_cache
      .filter((item) => item.normalized_phrase.includes(normalized))
      .limit(4)
      .toArray()
      .then(setCacheSuggestions);
  }, [inputPhrase]);

  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = logs.reduce((sum, log) => sum + log.protein_g, 0);
  const totalCarbs = logs.reduce((sum, log) => sum + log.carbs_g, 0);
  const totalFat = logs.reduce((sum, log) => sum + log.fat_g, 0);

  const targetCal = targets.target_calories || 2200;
  const targetPro = targets.target_protein_g || 160;
  const targetCarb = targets.target_carbs_g || 220;
  const targetFat = targets.target_fat_g || 70;

  const caloriePct = Math.min(Math.round((totalCalories / targetCal) * 100), 100);

  const handleLogMeal = async (overrideItem?: MealCacheItem) => {
    const itemToLog = overrideItem || exactMatch;
    const phrase = overrideItem ? overrideItem.display_name : inputPhrase;
    if (!phrase.trim()) return;

    setIsLogging(true);
    const normalized = normalizeMealPhrase(phrase);

    if (itemToLog) {
      await db.meal_logs.add({
        date: currentDate,
        meal_type: 'lunch',
        raw_phrase: phrase,
        display_name: itemToLog.display_name,
        calories: itemToLog.calories,
        protein_g: itemToLog.protein_g,
        carbs_g: itemToLog.carbs_g,
        fat_g: itemToLog.fat_g,
        logged_at: new Date().toISOString(),
        was_cached: true,
      });

      await db.meal_cache.update(itemToLog.normalized_phrase, {
        hit_count: (itemToLog.hit_count || 1) + 1,
        last_used_at: new Date().toISOString(),
      });
    } else {
      const words = normalized.split(' ');
      const estCal = Math.max(180, words.length * 95);
      const estPro = Math.max(12, Math.round(estCal * 0.08));
      const estCarbs = Math.max(15, Math.round(estCal * 0.1));
      const estFat = Math.max(4, Math.round(estCal * 0.03));

      await db.meal_cache.put({
        normalized_phrase: normalized,
        display_name: phrase.trim(),
        calories: estCal,
        protein_g: estPro,
        carbs_g: estCarbs,
        fat_g: estFat,
        hit_count: 1,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      });

      await db.meal_logs.add({
        date: currentDate,
        meal_type: 'lunch',
        raw_phrase: phrase,
        display_name: phrase.trim(),
        calories: estCal,
        protein_g: estPro,
        carbs_g: estCarbs,
        fat_g: estFat,
        logged_at: new Date().toISOString(),
        was_cached: false,
      });
    }

    setInputPhrase('');
    setExactMatch(null);
    setIsLogging(false);
    onRefresh();
  };

  const handleDeleteMeal = async (id?: number) => {
    if (!id) return;
    await db.meal_logs.delete(id);
    onRefresh();
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-telemetry-emerald">
            <Utensils size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Nutrition & Calories</h2>
            <span className="text-[11px] font-mono text-slate-500">
              {targets.is_override ? 'Custom Day Target' : 'Standard Budget'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
            {totalCalories}
            <span className="text-xs font-normal text-slate-500"> / {targetCal} kcal</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-telemetry-emerald">
            {targetCal - totalCalories >= 0
              ? `${targetCal - totalCalories} kcal remaining`
              : `${totalCalories - targetCal} kcal surplus`}
          </span>
        </div>
      </div>

      {/* Calories Progress Bar */}
      <div className="space-y-3 mb-5">
        <div>
          <div className="flex justify-between text-xs font-mono mb-1 text-slate-600">
            <span>Daily Intake Progress</span>
            <span className="text-slate-900 font-bold">{caloriePct}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${caloriePct}%` }}
            />
          </div>
        </div>

        {/* Macro Chips */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase">Protein</span>
            <div className="text-sm font-bold font-mono text-emerald-700 tabular-nums">
              {totalProtein}g
            </div>
            <span className="text-[10px] text-slate-500 font-mono">tgt {targetPro}g</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase">Carbs</span>
            <div className="text-sm font-bold font-mono text-sky-700 tabular-nums">
              {totalCarbs}g
            </div>
            <span className="text-[10px] text-slate-500 font-mono">tgt {targetCarb}g</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase">Fats</span>
            <div className="text-sm font-bold font-mono text-rose-700 tabular-nums">
              {totalFat}g
            </div>
            <span className="text-[10px] text-slate-500 font-mono">tgt {targetFat}g</span>
          </div>
        </div>
      </div>

      {/* Input Field with Ingestion Preview */}
      <div className="mb-4">
        <label className="block text-[11px] font-mono uppercase font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
          <span>Log Meal (Natural Language Phrase)</span>
          {exactMatch && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={11} /> Deterministic Cache (0ms)
            </span>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            value={inputPhrase}
            onChange={(e) => setInputPhrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogMeal();
            }}
            placeholder="e.g. 2 eggs on sourdough toast"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-all font-medium"
          />
          <button
            onClick={() => handleLogMeal()}
            disabled={!inputPhrase.trim() || isLogging}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-xs disabled:opacity-40"
          >
            {exactMatch ? <Zap size={14} /> : <Plus size={14} />}
            <span>Log</span>
          </button>
        </div>

        {/* Exact Match Preview */}
        {exactMatch ? (
          <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-emerald-600" />
              <span className="text-slate-900 font-semibold">{exactMatch.display_name}</span>
            </div>
            <div className="font-mono text-slate-700">
              <span className="text-slate-900 font-bold">{exactMatch.calories}</span> kcal |{' '}
              <span className="text-emerald-700 font-bold">{exactMatch.protein_g}g P</span>
            </div>
          </div>
        ) : inputPhrase.trim().length > 2 && cacheSuggestions.length > 0 ? (
          <div className="mt-2 space-y-1">
            <span className="text-[10px] font-mono font-semibold text-slate-500">Cached Suggestions:</span>
            {cacheSuggestions.map((s) => (
              <button
                key={s.normalized_phrase}
                onClick={() => handleLogMeal(s)}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs transition-colors"
              >
                <span className="text-slate-800 font-medium">{s.display_name}</span>
                <span className="font-mono text-slate-600">{s.calories} kcal ({s.protein_g}g P)</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Quick Recent Presets */}
      {recentCacheItems.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 mb-1.5 block">
            Frequent Meals (1-Tap Log)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recentCacheItems.slice(0, 4).map((item) => (
              <button
                key={item.normalized_phrase}
                onClick={() => handleLogMeal(item)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-[11px] text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Zap size={11} className="text-emerald-600" />
                <span>{item.display_name}</span>
                <span className="font-mono text-slate-500 font-normal">({item.calories})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Logged Meals */}
      <div>
        <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 mb-2 block">
          Today's Logged Meals ({logs.length})
        </span>
        {logs.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
            No meals logged for this date. Enter a phrase above to track.
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      log.was_cached ? 'bg-emerald-500' : 'bg-brand-500'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{log.display_name}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {log.was_cached ? 'Deterministic Cache' : 'Dynamic Entry'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <span className="text-slate-900 font-bold">{log.calories} kcal</span>
                    <span className="text-emerald-700 text-[11px] font-semibold block">{log.protein_g}g P</span>
                  </div>
                  <button
                    onClick={() => handleDeleteMeal(log.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
