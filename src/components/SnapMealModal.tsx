import React, { useState, useRef } from 'react';
import { X, Camera, Zap, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { db } from '../db';
import { normalizeMealPhrase } from '../utils/normalizer';
import { compressImage, getFoodImageFallback } from '../utils/imageOptimizer';

interface SnapMealModalProps {
  currentDate: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const SnapMealModal: React.FC<SnapMealModalProps> = ({
  currentDate,
  onClose,
  onRefresh,
}) => {
  const [mode, setMode] = useState<'photo' | 'type' | 'quick'>('photo');
  const [typedPhrase, setTypedPhrase] = useState('2 eggs on sourdough toast');
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const matchedMeal = {
    name: '2 Eggs on Sourdough',
    cal: 340,
    pro: 18,
    carb: 32,
    fat: 14,
    confidence: '98%',
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 600, 600, 0.75);
      setCustomPhoto(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleLog = async () => {
    const phrase = mode === 'type' ? typedPhrase : matchedMeal.name;
    const normalized = normalizeMealPhrase(phrase);
    const finalImageUrl = customPhoto || getFoodImageFallback(phrase);

    await db.meal_logs.add({
      date: currentDate,
      meal_type: 'lunch',
      raw_phrase: phrase,
      display_name: phrase,
      calories: matchedMeal.cal,
      protein_g: matchedMeal.pro,
      carbs_g: matchedMeal.carb,
      fat_g: matchedMeal.fat,
      logged_at: new Date().toISOString(),
      was_cached: true,
      image_url: finalImageUrl,
    });

    await db.meal_cache.put({
      normalized_phrase: normalized,
      display_name: phrase,
      calories: matchedMeal.cal,
      protein_g: matchedMeal.pro,
      carbs_g: matchedMeal.carb,
      fat_g: matchedMeal.fat,
      hit_count: 5,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      image_url: finalImageUrl,
    });

    setIsLogged(true);
    setTimeout(() => {
      onRefresh();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-ink/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 border border-cream-200 shadow-2xl flex flex-col gap-3 my-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Camera size={18} className="text-coral" />
            <b className="text-base font-bold text-ink">Snap meal</b>
          </div>
          <button onClick={onClose} className="p-1 text-ink-mute hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder simulation with interactive custom photo support */}
        {mode === 'photo' ? (
          <div className="h-64 rounded-3xl bg-gradient-to-br from-[#F6D9A8] via-[#C98A4B] to-[#6E4524] relative flex items-center justify-center text-white/30 overflow-hidden shadow-inner">
            {customPhoto ? (
              <img
                src={customPhoto}
                alt="Captured meal"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-5 border-2 border-white/80 rounded-2xl pointer-events-none flex items-center justify-center">
                <Camera size={48} className="text-white/40" />
              </div>
            )}

            {/* AI Bounding Tags */}
            <div className="absolute top-10 left-8 bg-white text-ink text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
              Eggs · 2
            </div>
            <div className="absolute bottom-10 right-8 bg-white text-ink text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
              Sourdough
            </div>

            {/* Upload / Capture Trigger */}
            <label className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-ink text-xs font-bold px-3 py-1.5 rounded-xl shadow cursor-pointer flex items-center gap-1.5 transition-colors">
              <Upload size={13} className="text-coral" />
              <span>{isCompressing ? 'Compressing...' : 'Upload Photo'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="h-44 bg-cream-100 rounded-3xl p-4 flex flex-col justify-center border border-cream-200">
            <label className="text-xs font-bold text-ink-mute uppercase mb-1">
              Natural Language / Exact Phrase
            </label>
            <input
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              className="w-full bg-white border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink font-semibold focus:border-coral focus:outline-none"
            />
          </div>
        )}

        {/* Matched Meal Card */}
        <div className="bg-cream-100 rounded-2xl p-3 border border-cream-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sun-light overflow-hidden flex items-center justify-center flex-none border border-cream-200">
              {customPhoto ? (
                <img src={customPhoto} alt="Meal preview" className="w-full h-full object-cover" />
              ) : (
                <Zap size={22} className="text-coral" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <b className="text-sm font-bold text-ink block truncate">{matchedMeal.name}</b>
              <small className="text-coral font-bold text-xs block">
                Matched instantly · {matchedMeal.confidence}
              </small>
            </div>
            <b className="text-base font-bold font-mono text-ink">{matchedMeal.cal}</b>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-cream-200 text-center text-xs">
            <div>
              <span className="text-[10px] text-ink-mute block">Protein</span>
              <b className="text-ink font-bold">{matchedMeal.pro}g</b>
            </div>
            <div>
              <span className="text-[10px] text-ink-mute block">Carbs</span>
              <b className="text-ink font-bold">{matchedMeal.carb}g</b>
            </div>
            <div>
              <span className="text-[10px] text-ink-mute block">Fats</span>
              <b className="text-ink font-bold">{matchedMeal.fat}g</b>
            </div>
          </div>
        </div>

        {/* Log Meal CTA */}
        <button
          onClick={handleLog}
          className="w-full py-3.5 bg-coral hover:bg-coral-hover text-white font-bold rounded-2xl text-sm transition-all shadow-card active:scale-[0.99] flex items-center justify-center gap-1.5"
        >
          {isLogged ? <Check size={18} strokeWidth={3} /> : null}
          <span>{isLogged ? 'Logged with photo!' : 'Log meal'}</span>
        </button>

        {/* Segmented Mode Switcher */}
        <div className="flex bg-cream-100 border border-cream-200 rounded-xl p-1 text-xs font-semibold text-center">
          <button
            onClick={() => setMode('photo')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === 'photo' ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => setMode('type')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === 'type' ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
            }`}
          >
            Type
          </button>
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === 'quick' ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
            }`}
          >
            Quick
          </button>
        </div>
      </div>
    </div>
  );
};
