import React, { useState, useEffect } from 'react';
import { Utensils, Zap, Plus, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
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

  // Load frequent/recent cache items on mount
  useEffect(() => {
    db.meal_cache
      .orderBy('last_used_at')
      .reverse()
      .limit(6)
      .toArray()
      .then(setRecentCacheItems);
  }, [logs]);

  // Check phrase match on input change
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

  // Aggregate daily totals
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const totalProtein = logs.reduce((sum, log) => sum + log.protein_g, 0);
  const totalCarbs = logs.reduce((sum, log) => sum + log.carbs_g, 0);
  const totalFat = logs.reduce((sum, log) => sum + log.fat_g, 0);

  const caloriePct = Math.min(Math.round((totalCalories / (targets.target_calories || 2200)) * 100), 100);
  const proteinPct = Math.min(Math.round((totalProtein / (targets.target_protein_g || 160)) * 100), 100);

  const handleLogMeal = async (overrideItem?: MealCacheItem) => {
    const itemToLog = overrideItem || exactMatch;
    const phrase = overrideItem ? overrideItem.display_name : inputPhrase;
    if (!phrase.trim()) return;

    setIsLogging(true);
    const normalized = normalizeMealPhrase(phrase);

    if (itemToLog) {
      // Deterministic Cache Hit
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

      // Increment hit count
      await db.meal_cache.update(itemToLog.normalized_phrase, {
        hit_count: (itemToLog.hit_count || 1) + 1,
        last_used_at: new Date().toISOString(),
      });
    } else {
      // Cache Miss: Simulate deterministic parsing & save to cache
      const words = normalized.split(' ');
      const estCal = Math.max(180, words.length * 95);
      const estPro = Math.max(12, Math.round(estCal * 0.08));
      const estCarbs = Math.max(15, Math.round(estCal * 0.1));
      const estFat = Math.max(4, Math.round(estCal * 0.03));

      // Save to cache for future 2nd-time deterministic lookup
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

      // Log meal
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
    <div className="bg-obsidian-800/90 border border-obsidian-700/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald">
            <Utensils size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Nutrition & Diet</h2>
            <span className="text-[11px] font-mono text-slate-400">
              {targets.is_override ? 'Custom Day Target' : 'Standard Target'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
            {totalCalories}
            <span className="text-xs font-normal text-slate-400"> / {targets.target_calories} kcal</span>
          </div>
          <span className="text-[10px] font-mono uppercase text-accent-emerald font-medium">
            {targets.target_calories - totalCalories >= 0
              ? `${targets.target_calories - totalCalories} kcal remaining`
              : `${totalCalories - targets.target_calories} kcal surplus`}
          </span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 mb-5">
        <div>
          <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
            <span>Calories Progress</span>
            <span className="text-accent-amber font-semibold">{caloriePct}%</span>
          </div>
          <div className="h-2 w-full bg-obsidian-950 rounded-full overflow-hidden border border-obsidian-700/50">
            <div
              className="h-full bg-gradient-to-r from-accent-amber to-accent-emerald transition-all duration-500 rounded-full"
              style={{ width: `${caloriePct}%` }}
            />
          </div>
        </div>

        {/* Macros Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-obsidian-900/90 border border-obsidian-700/50 rounded-xl p-2.5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Protein</span>
            <div className="text-sm font-bold font-mono text-accent-emerald tabular-nums">
              {totalProtein}g
            </div>
            <span className="text-[10px] text-slate-500 font-mono">tgt {targets.target_protein_g}g</span>
          </div>

          <div className="bg-obsidian-900/90 border border-obsidian-700/50 rounded-xl p-2.5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Carbs</span>
            <div className="text-sm font-bold font-mono text-accent-cyan tabular-nums">
              {totalCarbs}g
            </div>
            <span className="text-[10px] text-slate-500 font-mono">tgt {targets.target_carbs_g}g</span>
          </div>

          <div className="bg-obsidian-900/90 border border-obsidian-700/50 rounded-xl p-2.5 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Fats</span>
            <div className="text-sm font-bold font-mono text-accent-rose tabular-nums">
              {totalFat}g
            </div>
            <span className="text-[10px] text-slate-500 font-mono">tgt {targets.target_fat_g}g</span>
          </div>
        </div>
      </div>

      {/* Exact-Phrase Ingestion Input */}
      <div className="mb-4">
        <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Log Meal (Natural Language / Exact Phrase)</span>
          {exactMatch && (
            <span className="inline-flex items-center gap-1 text-[10px] text-accent-emerald font-semibold">
              <CheckCircle2 size={12} /> Deterministic Cache (0ms)
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
            className="w-full bg-obsidian-900 border border-obsidian-700/90 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-emerald focus:ring-1 focus:ring-accent-emerald transition-all"
          />
          <button
            onClick={() => handleLogMeal()}
            disabled={!inputPhrase.trim() || isLogging}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-accent-emerald/20 hover:bg-accent-emerald text-accent-emerald hover:text-obsidian-950 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-40"
          >
            {exactMatch ? <Zap size={14} /> : <Plus size={14} />}
            <span>Log</span>
          </button>
        </div>

        {/* Exact Match Preview or Suggestions */}
        {exactMatch ? (
          <div className="mt-2 p-2.5 bg-accent-emerald/10 border border-accent-emerald/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-accent-emerald" />
              <span className="text-slate-200 font-medium">{exactMatch.display_name}</span>
            </div>
            <div className="font-mono text-slate-300">
              <span className="text-white font-bold">{exactMatch.calories}</span> kcal |{' '}
              <span className="text-accent-emerald font-semibold">{exactMatch.protein_g}g P</span>
            </div>
          </div>
        ) : inputPhrase.trim().length > 2 && cacheSuggestions.length > 0 ? (
          <div className="mt-2 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">Cached Matches:</span>
            {cacheSuggestions.map((s) => (
              <button
                key={s.normalized_phrase}
                onClick={() => handleLogMeal(s)}
                className="w-full text-left p-2 rounded-lg bg-obsidian-900/60 hover:bg-obsidian-900 border border-obsidian-700/40 flex items-center justify-between text-xs transition-colors"
              >
                <span className="text-slate-300">{s.display_name}</span>
                <span className="font-mono text-slate-400">{s.calories} kcal ({s.protein_g}g P)</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Quick Recent Presets */}
      {recentCacheItems.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 block">
            Frequent Meals (1-Tap Log)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recentCacheItems.slice(0, 4).map((item) => (
              <button
                key={item.normalized_phrase}
                onClick={() => handleLogMeal(item)}
                className="px-2.5 py-1 rounded-lg bg-obsidian-900 hover:bg-obsidian-700/80 border border-obsidian-700/50 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Zap size={10} className="text-accent-emerald" />
                <span>{item.display_name}</span>
                <span className="font-mono text-slate-400">({item.calories})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Logged Meals */}
      <div>
        <span className="text-[10px] font-mono uppercase text-slate-400 mb-2 block">
          Today's Recorded Intake ({logs.length})
        </span>
        {logs.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-obsidian-700 rounded-xl text-xs text-slate-400">
            No meals logged for this date. Enter a phrase above to track.
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-obsidian-900/80 border border-obsidian-700/60 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      log.was_cached ? 'bg-accent-emerald' : 'bg-accent-cyan'
                    }`}
                  />
                  <div>
                    <div className="font-medium text-slate-200">{log.display_name}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {log.was_cached ? 'Deterministic Cache' : 'Dynamic Log'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <span className="text-white font-semibold">{log.calories} kcal</span>
                    <span className="text-slate-400 text-[11px] block">{log.protein_g}g P</span>
                  </div>
                  <button
                    onClick={() => handleDeleteMeal(log.id)}
                    className="p-1 rounded-md text-slate-500 hover:text-accent-rose hover:bg-obsidian-800 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 size={13} />
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
