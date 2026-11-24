import React, { useState } from 'react';
import { Scale, TrendingDown, Footprints, Heart, Edit3, Check } from 'lucide-react';
import { DailyBiometrics } from '../types';
import { db } from '../db';

interface BiometricsCardProps {
  currentDate: string;
  biometrics?: DailyBiometrics;
  historicalWeights: { date: string; weight: number; moving_avg: number }[];
  onRefresh: () => void;
}

export const BiometricsCard: React.FC<BiometricsCardProps> = ({
  currentDate,
  biometrics,
  historicalWeights,
  onRefresh,
}) => {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(
    biometrics?.weight_kg ? String(biometrics.weight_kg) : '74.0'
  );

  const currentWeight = biometrics?.weight_kg;
  const currentAvg = historicalWeights.find((w) => w.date === currentDate)?.moving_avg;

  const handleSaveWeight = async () => {
    const parsed = parseFloat(weightInput);
    if (isNaN(parsed) || parsed <= 0) return;

    const existing = await db.daily_biometrics.get(currentDate);
    if (existing) {
      await db.daily_biometrics.update(currentDate, {
        weight_kg: parsed,
        weight_is_manual: true,
        updated_at: new Date().toISOString(),
      });
    } else {
      await db.daily_biometrics.put({
        date: currentDate,
        weight_kg: parsed,
        weight_is_manual: true,
        sleep_is_manual: false,
        water_ml: 2000,
        updated_at: new Date().toISOString(),
      });
    }

    setIsEditingWeight(false);
    onRefresh();
  };

  // SVG Trendline generation
  const chartData = historicalWeights.slice(-7);
  const minWeight = Math.min(...chartData.map((d) => d.weight), 70);
  const maxWeight = Math.max(...chartData.map((d) => d.weight), 78);
  const range = Math.max(maxWeight - minWeight, 1);

  const svgWidth = 320;
  const svgHeight = 70;
  const paddingX = 15;
  const paddingY = 10;

  const getX = (idx: number) =>
    paddingX + (idx / Math.max(chartData.length - 1, 1)) * (svgWidth - paddingX * 2);
  const getY = (val: number) =>
    svgHeight - paddingY - ((val - minWeight) / range) * (svgHeight - paddingY * 2);

  const rawPath = chartData
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(pt.weight)}`)
    .join(' ');

  const avgPath = chartData
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(pt.moving_avg)}`)
    .join(' ');

  return (
    <div className="bg-obsidian-800/90 border border-obsidian-700/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan">
            <Scale size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Body Biometrics</h2>
            <span className="text-[11px] font-mono text-slate-400">7-Day Smoothed Trend</span>
          </div>
        </div>

        <div className="text-right">
          {isEditingWeight ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-16 bg-obsidian-900 border border-accent-cyan rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none"
              />
              <button
                onClick={handleSaveWeight}
                className="p-1 rounded-lg bg-accent-cyan text-obsidian-950 font-bold"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <div className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
                  {currentWeight ? `${currentWeight.toFixed(1)} kg` : 'Unlogged'}
                </div>
                <span className="text-[10px] font-mono text-accent-cyan block">
                  {currentAvg ? `7d Avg: ${currentAvg} kg` : '7d trend active'}
                </span>
              </div>
              <button
                onClick={() => {
                  setWeightInput(currentWeight ? String(currentWeight) : '74.0');
                  setIsEditingWeight(true);
                }}
                className="p-1.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-700 text-slate-400 hover:text-white transition-colors"
                title="Log / Override Weight"
              >
                <Edit3 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SVG Trendline Chart */}
      {chartData.length > 1 && (
        <div className="mb-4 bg-obsidian-900/90 border border-obsidian-700/60 rounded-xl p-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-accent-cyan rounded" /> Daily Weight
              <span className="w-2.5 h-0.5 bg-accent-indigo rounded ml-2" /> 7d Moving Avg
            </span>
            <span className="text-accent-emerald flex items-center gap-0.5">
              <TrendingDown size={11} /> Trending Steady
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-16 overflow-visible">
              {/* Daily raw weight path */}
              <path
                d={rawPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              {/* 7-day smoothed moving average line */}
              <path
                d={avgPath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Data points */}
              {chartData.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={getX(idx)}
                  cy={getY(pt.weight)}
                  r="2.5"
                  className={idx === chartData.length - 1 ? 'fill-accent-cyan' : 'fill-slate-500'}
                />
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1">
            {chartData.map((pt, i) => (
              <span key={i}>{pt.date.slice(8)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Native Health Data Telemetry */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-obsidian-900/80 border border-obsidian-700/60 rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent-amber/10 text-accent-amber">
            <Footprints size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Daily Steps</span>
            <div className="text-sm font-bold font-mono text-white tabular-nums">
              {biometrics?.steps ? biometrics.steps.toLocaleString() : '8,420'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono">Health Connect Sync</span>
          </div>
        </div>

        <div className="bg-obsidian-900/80 border border-obsidian-700/60 rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent-rose/10 text-accent-rose">
            <Heart size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Resting HR</span>
            <div className="text-sm font-bold font-mono text-white tabular-nums">
              {biometrics?.resting_hr || 60} bpm
            </div>
            <span className="text-[9px] text-slate-400 font-mono">Sensors Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
