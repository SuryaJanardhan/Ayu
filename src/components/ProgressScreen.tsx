import React, { useState } from 'react';
import { Camera, TrendingDown, User, Sparkles } from 'lucide-react';
import { DailyBiometrics } from '../types';

interface ProgressScreenProps {
  currentDate: string;
  biometrics?: DailyBiometrics;
  historicalWeights: { date: string; weight: number; moving_avg: number }[];
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  biometrics,
  historicalWeights,
}) => {
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  const currentWeight = biometrics?.weight_kg || 73.8;

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

      {/* Before / After Photo Progression */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-2 px-1">
          Before · After
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-44 rounded-3xl bg-gradient-to-b from-[#C7D2FE] to-[#E0E7FF] flex flex-col items-center justify-center relative p-3 text-ink/70">
            <User size={54} strokeWidth={1.5} />
            <em className="absolute bottom-2.5 left-2.5 bg-ink/75 text-white not-italic text-[11px] font-bold px-2 py-0.5 rounded-xl">
              Oct 24
            </em>
          </div>

          <div className="h-44 rounded-3xl bg-gradient-to-b from-[#FFC9B3] to-[#FFE4D9] flex flex-col items-center justify-center relative p-3 text-coral">
            <User size={54} strokeWidth={1.8} />
            <em className="absolute bottom-2.5 left-2.5 bg-ink/75 text-white not-italic text-[11px] font-bold px-2 py-0.5 rounded-xl">
              Today
            </em>
          </div>
        </div>
      </div>

      {/* Add Progress Photo CTA */}
      <button className="w-full py-3.5 bg-coral-light hover:bg-coral text-coral hover:text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-card transition-all active:scale-[0.99]">
        <Camera size={16} />
        <span>Add progress photo</span>
      </button>
    </div>
  );
};
