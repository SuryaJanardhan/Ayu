import React from 'react';
import { Dumbbell, Activity, Flame, Plus, Play, Clock, Trash2 } from 'lucide-react';
import { WorkoutTemplate, WorkoutSession } from '../types';
import { db } from '../db';

interface TrainScreenProps {
  currentDate: string;
  sessions: WorkoutSession[];
  templates: WorkoutTemplate[];
  onOpenSessionModal: (template?: WorkoutTemplate) => void;
  onRefresh: () => void;
}

export const TrainScreen: React.FC<TrainScreenProps> = ({
  currentDate,
  sessions,
  templates,
  onOpenSessionModal,
  onRefresh,
}) => {
  const handleDeleteSession = async (id?: number) => {
    if (!id) return;
    await db.workout_sessions.delete(id);
    onRefresh();
  };

  const workoutCards = [
    {
      templateId: 'template-push',
      name: 'Push day',
      detail: '5 exercises · 45 min',
      gradient: 'from-[#FF5C35] to-[#FF2D75]',
      icon: Dumbbell,
    },
    {
      templateId: 'template-legs',
      name: 'Legs',
      detail: '6 exercises · 55 min',
      gradient: 'from-[#2E9BFF] to-[#1B6FD1]',
      icon: Activity,
    },
    {
      templateId: 'template-cardio',
      name: 'Cardio',
      detail: '30 min · zone 2',
      gradient: 'from-[#FFB020] to-[#F58A07]',
      icon: Flame,
    },
  ];

  return (
    <div className="flex flex-col gap-3.5 pb-2">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <small className="text-ink-mute text-xs block font-medium">Rest day suggested</small>
          <b className="text-xl font-bold tracking-tight text-ink">Train</b>
        </div>
        <div className="px-3 py-1 rounded-full bg-coral-light text-coral font-bold text-xs flex items-center gap-1 shadow-xs">
          <Flame size={14} />
          <span>3 streak</span>
        </div>
      </div>

      {/* Routine Cards */}
      <div className="space-y-2.5">
        {workoutCards.map((w, idx) => {
          const Icon = w.icon;
          const matchedTemplate = templates.find((t) => t.id === w.templateId) || templates[idx];
          return (
            <button
              key={idx}
              onClick={() => onOpenSessionModal(matchedTemplate)}
              className={`w-full h-28 rounded-3xl p-4 bg-gradient-to-br ${w.gradient} text-white flex flex-col justify-end relative overflow-hidden text-left shadow-card hover:opacity-95 active:scale-[0.99] transition-all`}
            >
              <div className="absolute right-4 top-2 text-white/30">
                <Icon size={64} strokeWidth={1.5} />
              </div>
              <b className="text-lg font-bold leading-tight">{w.name}</b>
              <small className="text-xs text-white/90 font-medium">{w.detail}</small>
            </button>
          );
        })}
      </div>

      {/* Start Empty Workout CTA */}
      <button
        onClick={() => onOpenSessionModal()}
        className="w-full py-3.5 bg-coral hover:bg-coral-hover text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-card transition-all active:scale-[0.99]"
      >
        <Plus size={16} />
        <span>Start empty workout</span>
      </button>

      {/* Today's Completed Sessions */}
      {sessions.length > 0 && (
        <div className="mt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-2 px-1">
            Completed Today
          </h3>
          <div className="space-y-2">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-white border border-cream-200 rounded-2xl p-3.5 shadow-card text-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <b className="text-sm font-bold text-ink">{sess.name}</b>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-mute font-mono text-[11px] flex items-center gap-1">
                      <Clock size={12} /> {sess.duration_minutes}m
                    </span>
                    <button
                      onClick={() => handleDeleteSession(sess.id)}
                      className="text-ink-mute hover:text-rose p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-ink-mute font-mono">
                  {sess.exercises.map((e) => e.name).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
