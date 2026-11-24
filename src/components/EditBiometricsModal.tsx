import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { DailyBiometrics } from '../types';
import { db } from '../db';

interface EditBiometricsModalProps {
  currentDate: string;
  biometrics?: DailyBiometrics;
  onClose: () => void;
  onRefresh: () => void;
}

export const EditBiometricsModal: React.FC<EditBiometricsModalProps> = ({
  currentDate,
  biometrics,
  onClose,
  onRefresh,
}) => {
  const [weight, setWeight] = useState(
    biometrics?.weight_kg ? String(biometrics.weight_kg) : '73.8'
  );
  const [sleep, setSleep] = useState(
    biometrics?.sleep_hours ? String(biometrics.sleep_hours) : '7.4'
  );
  const [steps, setSteps] = useState(
    biometrics?.steps ? String(biometrics.steps) : '9500'
  );
  const [bpm, setBpm] = useState(
    biometrics?.resting_hr ? String(biometrics.resting_hr) : '60'
  );

  const handleSave = async () => {
    const w = parseFloat(weight) || 73.8;
    const s = parseFloat(sleep) || 7.4;
    const st = parseInt(steps, 10) || 9500;
    const b = parseInt(bpm, 10) || 60;

    const existing = await db.daily_biometrics.get(currentDate);
    if (existing) {
      await db.daily_biometrics.update(currentDate, {
        weight_kg: w,
        weight_is_manual: true,
        sleep_hours: s,
        sleep_is_manual: true,
        steps: st,
        resting_hr: b,
        updated_at: new Date().toISOString(),
      });
    } else {
      await db.daily_biometrics.put({
        date: currentDate,
        weight_kg: w,
        weight_is_manual: true,
        sleep_hours: s,
        sleep_is_manual: true,
        steps: st,
        resting_hr: b,
        water_ml: 2500,
        updated_at: new Date().toISOString(),
      });
    }

    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white border border-cream-200 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Update Biometrics</h3>
            <span className="text-xs font-mono text-ink-mute">Manual Sensor Override</span>
          </div>
          <button onClick={onClose} className="p-1 text-ink-mute hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-bold uppercase text-ink-mute block mb-1">
              Body Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-ink-mute block mb-1">
              Sleep Duration (hours)
            </label>
            <input
              type="number"
              step="0.1"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold focus:border-coral focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold uppercase text-ink-mute block mb-1">
                Steps
              </label>
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold focus:border-coral focus:outline-none text-center"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-ink-mute block mb-1">
                Resting BPM
              </label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                className="w-full bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-sm text-ink font-mono font-bold focus:border-coral focus:outline-none text-center"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-coral hover:bg-coral-hover text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-card"
        >
          <Check size={16} />
          <span>Save Biometric Override</span>
        </button>
      </div>
    </div>
  );
};
