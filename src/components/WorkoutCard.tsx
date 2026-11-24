import React, { useState, useEffect } from 'react';
import { Dumbbell, Play, History, Check, Clock, Trash2 } from 'lucide-react';
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
    <div className="bg-obsidian-800/90 border border-obsidian-700/80 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo">
            <Dumbbell size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Workouts & Training</h2>
            <span className="text-[11px] font-mono text-slate-400">Template Memory Engine</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
            {sessions.length}
            <span className="text-xs font-normal text-slate-400"> sessions</span>
          </div>
          <span className="text-[10px] font-mono text-accent-indigo font-medium">
            {totalMinutes > 0 ? `${totalMinutes} min | ${totalVolume.toLocaleString()} kg volume` : 'Rest or pending'}
          </span>
        </div>
      </div>

      {/* Routine Templates with Memory Trigger */}
      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase text-slate-400 mb-2 block flex items-center justify-between">
          <span>Start Workout Template</span>
          <span className="text-accent-indigo text-[10px] lowercase font-mono">auto-loads last weights</span>
        </span>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onOpenSessionModal(tmpl)}
              className="p-3 bg-obsidian-900/90 hover:bg-obsidian-900 border border-obsidian-700/60 hover:border-accent-indigo/40 rounded-xl text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-accent-indigo transition-colors line-clamp-1">
                  {tmpl.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {tmpl.exercises.length} exercises
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 capitalize">{tmpl.category}</span>
                <span className="p-1 rounded-md bg-accent-indigo/10 text-accent-indigo group-hover:bg-accent-indigo group-hover:text-white transition-all">
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
          className="w-full py-2 bg-obsidian-900 hover:bg-obsidian-700/60 border border-dashed border-obsidian-700 rounded-xl text-xs text-slate-300 hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Dumbbell size={14} className="text-slate-400" />
          <span>Start Custom / Freestyle Session</span>
        </button>
      </div>

      {/* Today's Completed Sessions */}
      <div>
        <span className="text-[10px] font-mono uppercase text-slate-400 mb-2 block">
          Today's Recorded Sessions ({sessions.length})
        </span>
        {sessions.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-obsidian-700 rounded-xl text-xs text-slate-400">
            No training logged yet today. Select a template above to start.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3 bg-obsidian-900/80 border border-obsidian-700/60 rounded-xl text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-indigo" />
                    <span className="font-semibold text-white">{sess.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock size={12} /> {sess.duration_minutes}m
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-accent-indigo/15 text-accent-indigo font-mono text-[10px]">
                      RPE {sess.rpe}
                    </span>
                    <button
                      onClick={() => handleDeleteSession(sess.id)}
                      className="p-1 rounded text-slate-500 hover:text-accent-rose hover:bg-obsidian-800 transition-colors ml-1"
                      title="Delete session"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-obsidian-800">
                  {sess.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="flex justify-between text-[11px] text-slate-300 font-mono">
                      <span className="text-slate-400">{ex.name}:</span>
                      <span className="text-white">
                        {ex.sets.map((s) => `${s.weight_kg}kg×${s.reps}`).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>

                {sess.notes && (
                  <p className="mt-2 text-[11px] text-slate-400 italic bg-obsidian-950/60 p-1.5 rounded-lg border border-obsidian-800">
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
