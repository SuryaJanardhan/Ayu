import React, { useState } from 'react';
import { Trash2, Plus, Coffee, Utensils, Apple, Sandwich, Edit3 } from 'lucide-react';
import { MealLog } from '../types';
import { db } from '../db';
import { normalizeMealPhrase } from '../utils/normalizer';
import { EditMealModal } from './EditMealModal';

interface MealsScreenProps {
  currentDate: string;
  mealLogs: MealLog[];
  onOpenQuickSnap: () => void;
  onRefresh: () => void;
}

export const MealsScreen: React.FC<MealsScreenProps> = ({
  currentDate,
  mealLogs,
  onOpenQuickSnap,
  onRefresh,
}) => {
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);

  const totalCalories = mealLogs.reduce((sum, m) => sum + m.calories, 0);

  const frequentMeals = [
    { name: 'Greek yogurt', cal: 220, pro: 20, icon: Apple, color: 'bg-coral-light text-coral' },
    { name: 'Whey shake', cal: 280, pro: 32, icon: Coffee, color: 'bg-sun-light text-sun' },
    { name: 'Chicken rice', cal: 520, pro: 48, icon: Utensils, color: 'bg-rose-light text-rose' },
    { name: 'Eggs toast', cal: 340, pro: 18, icon: Sandwich, color: 'bg-sky-light text-sky' },
  ];

  const handleQuickAdd = async (meal: typeof frequentMeals[0]) => {
    const normalized = normalizeMealPhrase(meal.name);
    await db.meal_logs.add({
      date: currentDate,
      meal_type: 'lunch',
      raw_phrase: meal.name,
      display_name: meal.name,
      calories: meal.cal,
      protein_g: meal.pro,
      carbs_g: Math.round(meal.cal * 0.1),
      fat_g: Math.round(meal.cal * 0.03),
      logged_at: new Date().toISOString(),
      was_cached: true,
    });
    onRefresh();
  };

  const handleDeleteMeal = async (id?: number) => {
    if (!id) return;
    await db.meal_logs.delete(id);
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <b className="text-xl font-bold tracking-tight text-ink">Meals</b>
        <div className="text-base font-extrabold text-coral font-mono tabular-nums">
          {totalCalories} kcal
        </div>
      </div>

      {/* Quick Add Carousel */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-2 px-1">
          Quick add
        </h3>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {frequentMeals.map((m, idx) => {
            const Icon = m.icon;
            return (
              <button
                key={idx}
                onClick={() => handleQuickAdd(m)}
                className="flex-none w-24 bg-white border border-cream-200 rounded-2xl p-2.5 text-center flex flex-col items-center hover:border-coral transition-colors shadow-xs active:scale-95"
              >
                <div className={`w-14 h-12 rounded-xl ${m.color} flex items-center justify-center mb-1.5`}>
                  <Icon size={22} />
                </div>
                <span className="text-[11px] font-bold text-ink leading-tight line-clamp-1">
                  {m.name}
                </span>
                <span className="text-[10px] text-ink-mute font-mono">{m.cal} kcal</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Logged Meals (With Edit & Delete) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-2 px-1">
          Today
        </h3>
        {mealLogs.length === 0 ? (
          <div className="bg-white border border-dashed border-cream-200 rounded-3xl p-6 text-center text-xs text-ink-mute">
            No meals recorded yet today. Tap below or use + to snap a meal.
          </div>
        ) : (
          <div className="space-y-2">
            {mealLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white border border-cream-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-card"
              >
                <div className="w-12 h-12 rounded-xl bg-sun-light text-sun flex items-center justify-center flex-none">
                  <Utensils size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <b className="text-sm font-bold text-ink block truncate">{log.display_name}</b>
                  <small className="text-ink-mute text-xs font-medium">
                    {log.protein_g}g protein {log.was_cached && '· Instant cache'}
                  </small>
                </div>
                <div className="flex items-center gap-2">
                  <b className="text-sm font-bold font-mono text-ink tabular-nums">
                    {log.calories}
                  </b>
                  {/* Edit Meal Button */}
                  <button
                    onClick={() => setEditingMeal(log)}
                    className="p-1 text-ink-mute hover:text-coral transition-colors"
                    title="Edit meal"
                  >
                    <Edit3 size={14} />
                  </button>
                  {/* Delete Meal Button */}
                  <button
                    onClick={() => handleDeleteMeal(log.id)}
                    className="p-1 text-ink-mute hover:text-rose transition-colors"
                    title="Delete meal"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Meal CTA */}
      <button
        onClick={onOpenQuickSnap}
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-cream-200 hover:border-coral bg-white text-ink-mute hover:text-coral font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
      >
        <Plus size={16} />
        <span>Tap + to log meal or snap photo</span>
      </button>

      {/* Edit Modal */}
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onClose={() => setEditingMeal(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
