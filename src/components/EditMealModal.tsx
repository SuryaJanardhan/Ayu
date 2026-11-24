import React, { useState, useRef } from 'react';
import { X, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { MealLog } from '../types';
import { db } from '../db';
import { normalizeMealPhrase } from '../utils/normalizer';
import { compressImage, getFoodImageFallback } from '../utils/imageOptimizer';

interface EditMealModalProps {
  meal: MealLog;
  onClose: () => void;
  onRefresh: () => void;
}

export const EditMealModal: React.FC<EditMealModalProps> = ({
  meal,
  onClose,
  onRefresh,
}) => {
  const [name, setName] = useState(meal.display_name);
  const [calories, setCalories] = useState(String(meal.calories));
  const [protein, setProtein] = useState(String(meal.protein_g));
  const [carbs, setCarbs] = useState(String(meal.carbs_g));
  const [fat, setFat] = useState(String(meal.fat_g));
  const [photoUrl, setPhotoUrl] = useState<string>(
    meal.image_url || getFoodImageFallback(meal.display_name)
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 600, 600, 0.75);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = async () => {
    if (!meal.id) return;
    const cal = parseFloat(calories) || 0;
    const pro = parseFloat(protein) || 0;
    const carb = parseFloat(carbs) || 0;
    const f = parseFloat(fat) || 0;

    await db.meal_logs.update(meal.id, {
      display_name: name.trim() || meal.display_name,
      calories: cal,
      protein_g: pro,
      carbs_g: carb,
      fat_g: f,
      image_url: photoUrl,
    });

    const normalized = normalizeMealPhrase(name.trim() || meal.display_name);
    await db.meal_cache.put({
      normalized_phrase: normalized,
      display_name: name.trim() || meal.display_name,
      calories: cal,
      protein_g: pro,
      carbs_g: carb,
      fat_g: f,
      hit_count: 5,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      image_url: photoUrl,
    });

    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white border border-cream-200 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-ink">Edit Meal & Photo</h3>
          <button onClick={onClose} className="p-1 text-ink-mute hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {/* Photo Attachment & Compression */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-cream-100 rounded-2xl border border-cream-200">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-cream-200 flex-none flex items-center justify-center">
            <img src={photoUrl} alt="Meal preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-bold text-ink block">Meal Photo Attachment</span>
            <label className="inline-flex items-center gap-1 text-[11px] font-bold text-coral hover:underline cursor-pointer mt-0.5">
              <Upload size={12} />
              <span>{isCompressing ? 'Compressing...' : 'Change Photo'}</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-bold uppercase text-ink-mute block mb-1">
              Meal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink font-semibold focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-ink-mute block mb-1">
              Calories (kcal)
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold focus:border-coral focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-ink-mute block mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-2 py-2 text-xs text-ink font-mono font-bold focus:border-coral focus:outline-none text-center"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-ink-mute block mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-2 py-2 text-xs text-ink font-mono font-bold focus:border-coral focus:outline-none text-center"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-ink-mute block mb-1">
                Fats (g)
              </label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-2 py-2 text-xs text-ink font-mono font-bold focus:border-coral focus:outline-none text-center"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-coral hover:bg-coral-hover text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-card"
        >
          <Check size={16} />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};
