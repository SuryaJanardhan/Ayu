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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-telemetry-sky">
            <Scale size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Body Biometrics</h2>
            <span className="text-[11px] font-mono text-slate-500">7-Day Smoothed Trend</span>
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
                className="w-16 bg-white border border-brand-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono font-bold text-center focus:outline-none shadow-xs"
              />
              <button
                onClick={handleSaveWeight}
                className="p-1 rounded-lg bg-brand-600 text-white font-bold shadow-xs hover:bg-brand-700"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <div className="text-xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
                  {currentWeight ? `${currentWeight.toFixed(1)} kg` : 'Unlogged'}
                </div>
                <span className="text-[11px] font-mono font-semibold text-sky-700 block">
                  {currentAvg ? `7d Avg: ${currentAvg} kg` : '7d trend active'}
                </span>
              </div>
              <button
                onClick={() => {
                  setWeightInput(currentWeight ? String(currentWeight) : '74.0');
                  setIsEditingWeight(true);
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
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
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-500 rounded" /> Daily Weight
              <span className="w-2.5 h-0.5 bg-indigo-600 rounded ml-2" /> 7d Moving Avg
            </span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              <TrendingDown size={12} /> Steady Progress
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-16 overflow-visible">
              <path
                d={rawPath}
                fill="none"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <path
                d={avgPath}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {chartData.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={getX(idx)}
                  cy={getY(pt.weight)}
                  r="3"
                  className={idx === chartData.length - 1 ? 'fill-sky-600 stroke-white stroke-2' : 'fill-slate-400'}
                />
              ))}
            </svg>
          </div>

          <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1.5 font-medium">
            {chartData.map((pt, i) => (
              <span key={i}>{pt.date.slice(8)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Native Health Data Telemetry */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <Footprints size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 block">Daily Steps</span>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
              {biometrics?.steps ? biometrics.steps.toLocaleString() : '8,420'}
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Health Connect Sync</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
            <Heart size={16} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 block">Resting HR</span>
            <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
              {biometrics?.resting_hr || 60} bpm
            </div>
            <span className="text-[9px] text-slate-500 font-mono">Sensors Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
