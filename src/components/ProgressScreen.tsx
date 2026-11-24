import React, { useState, useEffect, useRef } from 'react';
import { Camera, TrendingDown, User, Plus, Trash2, Check, Upload } from 'lucide-react';
import { DailyBiometrics, ProgressPhoto } from '../types';
import { db } from '../db';
import { compressImage } from '../utils/imageOptimizer';
import { getTodayDateString } from '../utils/date';

interface ProgressScreenProps {
  currentDate: string;
  biometrics?: DailyBiometrics;
  historicalWeights: { date: string; weight: number; moving_avg: number }[];
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  biometrics,
}) => {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Weekly Check-in');
  const [newWeight, setNewWeight] = useState(
    biometrics?.weight_kg ? String(biometrics.weight_kg) : '73.8'
  );
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = async () => {
    const list = await db.progress_photos.orderBy('created_at').toArray();
    setPhotos(list);
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const currentWeight = biometrics?.weight_kg || 73.8;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 600, 800, 0.75);
      setPreviewPhoto(compressed);
    } catch (err) {
      console.error('Photo optimization failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProgressPhoto = async () => {
    if (!previewPhoto) return;

    await db.progress_photos.add({
      date: getTodayDateString(),
      label: newLabel.trim() || 'Check-in',
      weight_kg: parseFloat(newWeight) || currentWeight,
      image_url: previewPhoto,
      created_at: new Date().toISOString(),
    });

    setPreviewPhoto(null);
    setShowAddModal(false);
    await loadPhotos();
  };

  const handleDeletePhoto = async (id?: number) => {
    if (!id) return;
    await db.progress_photos.delete(id);
    await loadPhotos();
  };

  const beforePhoto = photos[0];
  const afterPhoto = photos.length > 1 ? photos[photos.length - 1] : photos[0];

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <b className="text-xl font-bold tracking-tight text-ink">Progress</b>
        <div className="flex bg-white border border-cream-200 rounded-xl p-0.5 shadow-xs text-xs font-semibold">
          <button
            onClick={() => setRange('7d')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              range === '7d' ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              range === '30d' ? 'bg-coral text-white' : 'text-ink-mute hover:text-ink'
            }`}
          >
            30d
          </button>
        </div>
      </div>

      {/* Weight Area Chart Card */}
      <div className="bg-white rounded-3xl p-4 border border-cream-200 shadow-card">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-baseline gap-1">
            <b className="text-2xl font-extrabold text-ink tabular-nums">{currentWeight}</b>
            <small className="text-ink-mute text-xs font-medium">kg</small>
          </div>
          <span className="text-coral font-bold text-xs flex items-center gap-0.5">
            <TrendingDown size={14} /> 0.4 this week
          </span>
        </div>

        {/* SVG Curve with Soft Gradient Fill */}
        <div className="w-full mt-2">
          <svg viewBox="0 0 280 90" width="100%" className="overflow-visible">
            <defs>
              <linearGradient id="coralArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE4D9" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFE4D9" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M0,30 C40,32 70,28 110,40 S190,52 230,56 S270,64 280,66 L280,90 L0,90Z"
              fill="url(#coralArea)"
            />
            <path
              d="M0,30 C40,32 70,28 110,40 S190,52 230,56 S270,64 280,66"
              fill="none"
              stroke="#FF5C35"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="280" cy="66" r="5" fill="#FF5C35" />
          </svg>
        </div>
      </div>

      {/* Before / After Photo Progression from Local DB */}
      <div>
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute">
            Before · After ({photos.length} photos)
          </h3>
          <span className="text-[10px] font-mono text-coral font-bold">Local Compressed Vault</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Before Photo */}
          <div className="h-44 rounded-3xl overflow-hidden bg-cream-100 border border-cream-200 relative flex items-center justify-center shadow-card">
            {beforePhoto ? (
              <img
                src={beforePhoto.image_url}
                alt={beforePhoto.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={54} className="text-ink/30" />
            )}
            <em className="absolute bottom-2.5 left-2.5 bg-ink/80 backdrop-blur-xs text-white not-italic text-[10px] font-bold px-2 py-0.5 rounded-xl shadow-xs">
              {beforePhoto ? `${beforePhoto.date.slice(5)} · ${beforePhoto.weight_kg}kg` : 'Initial'}
            </em>
          </div>

          {/* After / Current Photo */}
          <div className="h-44 rounded-3xl overflow-hidden bg-cream-100 border border-cream-200 relative flex items-center justify-center shadow-card">
            {afterPhoto ? (
              <img
                src={afterPhoto.image_url}
                alt={afterPhoto.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={54} className="text-coral/40" />
            )}
            <em className="absolute bottom-2.5 left-2.5 bg-coral text-white not-italic text-[10px] font-bold px-2 py-0.5 rounded-xl shadow-xs">
              {afterPhoto ? `Today · ${afterPhoto.weight_kg}kg` : 'Today'}
            </em>
            {photos.length > 2 && (
              <button
                onClick={() => handleDeletePhoto(afterPhoto?.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-ink/60 text-white hover:bg-rose transition-colors"
                title="Delete photo"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Progress Photo CTA */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-3.5 bg-coral-light hover:bg-coral text-coral hover:text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-card transition-all active:scale-[0.99]"
      >
        <Camera size={16} />
        <span>Add progress photo (Compressed Storage)</span>
      </button>

      {/* Upload Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-cream-200 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
            <b className="text-base font-bold text-ink">Add Progress Photo</b>

            <div className="h-48 rounded-2xl bg-cream-100 border border-dashed border-cream-200 flex flex-col items-center justify-center relative overflow-hidden">
              {previewPhoto ? (
                <img src={previewPhoto} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <label className="flex flex-col items-center cursor-pointer p-4 text-center">
                  <Upload size={32} className="text-coral mb-2" />
                  <span className="text-xs font-bold text-ink">
                    {isUploading ? 'Optimizing photo...' : 'Select or Take Photo'}
                  </span>
                  <span className="text-[10px] text-ink-mute mt-1">
                    Auto-downscaled to ~40KB WebP
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-ink-mute block mb-1">
                Check-in Label
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-1.5 text-xs text-ink font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-ink-mute block mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-1.5 text-xs text-ink font-mono font-bold"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setPreviewPhoto(null);
                  setShowAddModal(false);
                }}
                className="flex-1 py-2.5 bg-cream-100 text-ink-mute font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProgressPhoto}
                disabled={!previewPhoto}
                className="flex-1 py-2.5 bg-coral text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check size={14} />
                <span>Save to Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
