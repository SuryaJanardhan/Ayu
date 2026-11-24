import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Timer, Sparkles } from 'lucide-react';
import { WorkoutTemplate, WorkoutSession, ExerciseSet } from '../types';
import { db } from '../db';

interface WorkoutSessionModalProps {
  currentDate: string;
  template?: WorkoutTemplate;
  onClose: () => void;
  onRefresh: () => void;
}

export const WorkoutSessionModal: React.FC<WorkoutSessionModalProps> = ({
  currentDate,
  template,
  onClose,
  onRefresh,
}) => {
  const [sessionName, setSessionName] = useState(template ? template.name : 'Custom Strength Workout');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [rpe, setRpe] = useState(8);
  const [notes, setNotes] = useState('');
  const [memoryLoaded, setMemoryLoaded] = useState(false);

  interface LocalExercise {
    name: string;
    sets: ExerciseSet[];
  }

  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds]);

  useEffect(() => {
    async function loadPreviousMemory() {
      if (!template) {
        setExercises([
          {
            name: 'Exercise 1',
            sets: [
              { set_number: 1, weight_kg: 60, reps: 10, rpe: 7 },
              { set_number: 2, weight_kg: 60, reps: 10, rpe: 8 },
              { set_number: 3, weight_kg: 60, reps: 8, rpe: 9 },
            ],
          },
        ]);
        return;
      }

      const lastSession = await db.workout_sessions
        .where('template_id')
        .equals(template.id)
        .reverse()
        .first();

      if (lastSession && lastSession.exercises.length > 0) {
        setExercises(
          lastSession.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets.map((s, idx) => ({
              set_number: idx + 1,
              weight_kg: s.weight_kg,
              reps: s.reps,
              rpe: s.rpe || 8,
            })),
          }))
        );
        setMemoryLoaded(true);
      } else {
        setExercises(
          template.exercises.map((ex) => ({
            name: ex.name,
            sets: Array.from({ length: ex.target_sets || 3 }).map((_, idx) => ({
              set_number: idx + 1,
              weight_kg: ex.default_weight_kg || 50,
              reps: ex.default_reps || 10,
              rpe: 8,
            })),
          }))
        );
      }
    }

    loadPreviousMemory();
  }, [template]);

  const handleAddSet = (exIndex: number) => {
    setExercises((prev) => {
      const copy = [...prev];
      const targetEx = copy[exIndex];
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      targetEx.sets.push({
        set_number: targetEx.sets.length + 1,
        weight_kg: lastSet ? lastSet.weight_kg : 50,
        reps: lastSet ? lastSet.reps : 10,
        rpe: 8,
      });
      return copy;
    });
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: 'weight_kg' | 'reps',
    value: number
  ) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[exIndex].sets[setIndex][field] = value;
      return copy;
    });
  };

  const handleSaveSession = async () => {
    await db.workout_sessions.add({
      template_id: template?.id,
      name: sessionName,
      date: currentDate,
      started_at: new Date(Date.now() - durationMinutes * 60 * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: durationMinutes,
      rpe,
      notes,
      exercises,
    });

    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">{sessionName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-slate-500">Date: {currentDate}</span>
              {memoryLoaded && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  <Sparkles size={10} /> Pre-filled from Last Session
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Rest Timer Widget */}
        <div className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl my-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold">
            <Timer size={14} className="text-indigo-600" />
            <span className="text-slate-700">Rest Timer:</span>
            {timerSeconds !== null ? (
              <span className="text-amber-700 font-extrabold text-sm tabular-nums">
                {timerSeconds}s remaining
              </span>
            ) : (
              <span className="text-slate-400 font-normal">Idle</span>
            )}
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
            <button
              onClick={() => setTimerSeconds(60)}
              className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-200 shadow-xs"
            >
              60s
            </button>
            <button
              onClick={() => setTimerSeconds(90)}
              className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-200 shadow-xs"
            >
              90s
            </button>
            <button
              onClick={() => setTimerSeconds(120)}
              className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-200 shadow-xs"
            >
              120s
            </button>
            {timerSeconds !== null && (
              <button
                onClick={() => setTimerSeconds(null)}
                className="px-1.5 py-1 text-rose-600 hover:bg-rose-50 rounded ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 my-1">
          {exercises.map((ex, exIdx) => (
            <div
              key={exIdx}
              className="bg-slate-50 border border-slate-200/90 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 font-mono">{ex.name}</span>
                <button
                  onClick={() => handleAddSet(exIdx)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 text-[10px] text-indigo-700 font-mono font-bold rounded flex items-center gap-1 shadow-xs"
                >
                  <Plus size={10} /> Add Set
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="grid grid-cols-12 gap-1 text-[9px] font-mono text-slate-500 uppercase font-semibold px-1">
                  <span className="col-span-2">Set</span>
                  <span className="col-span-5">Weight (kg)</span>
                  <span className="col-span-5">Reps</span>
                </div>

                {ex.sets.map((s, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-12 gap-1 items-center font-mono">
                    <span className="col-span-2 text-xs text-slate-500 font-bold pl-1">#{s.set_number}</span>
                    <div className="col-span-5">
                      <input
                        type="number"
                        step="0.5"
                        value={s.weight_kg}
                        onChange={(e) =>
                          handleUpdateSet(exIdx, sIdx, 'weight_kg', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono font-bold text-center focus:border-indigo-600 focus:outline-none shadow-xs"
                      />
                    </div>
                    <div className="col-span-5">
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) =>
                          handleUpdateSet(exIdx, sIdx, 'reps', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono font-bold text-center focus:border-indigo-600 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Duration, RPE, Notes */}
        <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs font-mono mb-3">
          <div>
            <label className="text-slate-600 text-[10px] font-semibold uppercase block mb-1">Duration (min)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold"
            />
          </div>
          <div>
            <label className="text-slate-600 text-[10px] font-semibold uppercase block mb-1">RPE Intensity (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value, 10) || 8)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSaveSession}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <Check size={16} />
          <span>Complete & Save Workout Session</span>
        </button>
      </div>
    </div>
  );
};
