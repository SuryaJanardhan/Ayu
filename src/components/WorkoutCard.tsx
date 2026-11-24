import React, { useState, useEffect } from 'react';
import { Dumbbell, Play, Clock, Trash2 } from 'lucide-react';
import { WorkoutTemplate, WorkoutSession } from '../types';
import { db } from '../db';

interface WorkoutCardProps {
  currentDate: string;
  sessions: WorkoutSession[];
  onOpenSessionModal: (template?: WorkoutTemplate) => void;
  onRefresh: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  currentDate,
  sessions,
  onOpenSessionModal,
  onRefresh,
}) => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    db.workout_templates.toArray().then(setTemplates);
  }, []);

  const handleDeleteSession = async (id?: number) => {
    if (!id) return;
    await db.workout_sessions.delete(id);
    onRefresh();
  };

  const totalVolume = sessions.reduce((acc, session) => {
    const sessionVolume = session.exercises.reduce((exAcc, ex) => {
      const exVol = ex.sets.reduce((setAcc, s) => setAcc + s.weight_kg * s.reps, 0);
      return exAcc + exVol;
    }, 0);
    return acc + sessionVolume;
  }, 0);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-telemetry-indigo">
            <Dumbbell size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Workouts & Training</h2>
            <span className="text-[11px] font-mono text-slate-500">Template Memory Engine</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold font-mono tracking-tight text-slate-900 tabular-nums">
            {sessions.length}
            <span className="text-xs font-normal text-slate-500"> sessions</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-indigo-700">
            {totalMinutes > 0 ? `${totalMinutes} min | ${totalVolume.toLocaleString()} kg volume` : 'Rest day or pending'}
          </span>
        </div>
      </div>

      {/* Routine Templates with Memory Trigger */}
      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 mb-2 block flex items-center justify-between">
          <span>Start Workout Template</span>
          <span className="text-indigo-600 text-[10px] font-mono font-medium">auto-loads last weights</span>
        </span>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onOpenSessionModal(tmpl)}
              className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {tmpl.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                  {tmpl.exercises.length} exercises
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-slate-500 capitalize">{tmpl.category}</span>
                <span className="p-1 rounded-md bg-white border border-slate-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 shadow-xs transition-all">
                  <Play size={10} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Freestyle Start Button */}
      <div className="mb-5">
        <button
          onClick={() => onOpenSessionModal()}
          className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Dumbbell size={14} className="text-slate-500" />
          <span>Start Custom / Freestyle Session</span>
        </button>
      </div>

      {/* Today's Completed Sessions */}
      <div>
        <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 mb-2 block">
          Today's Recorded Sessions ({sessions.length})
        </span>
        {sessions.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
            No training logged yet today. Select a template above to start.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="font-bold text-slate-900">{sess.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-600 text-[11px] flex items-center gap-1 font-medium">
                      <Clock size={12} /> {sess.duration_minutes}m
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold">
                      RPE {sess.rpe}
                    </span>
                    <button
                      onClick={() => handleDeleteSession(sess.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                      title="Delete session"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-slate-200">
                  {sess.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="flex justify-between text-[11px] text-slate-700 font-mono">
                      <span className="text-slate-600 font-medium">{ex.name}:</span>
                      <span className="text-slate-900 font-bold">
                        {ex.sets.map((s) => `${s.weight_kg}kg×${s.reps}`).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>

                {sess.notes && (
                  <p className="mt-2 text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                    "{sess.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
