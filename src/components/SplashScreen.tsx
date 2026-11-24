import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFading(true);
    }, 1200);

    const timer2 = setTimeout(() => {
      onFinish();
    }, 1700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      onClick={() => onFinish()}
      className={`fixed inset-0 z-50 bg-[#FFF9F3] flex flex-col items-center justify-center cursor-pointer transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-fade-in">
        {/* App Icon Container */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-coral to-[#FF2D75] flex items-center justify-center shadow-[0_12px_32px_rgba(255,92,53,0.35)] transform transition-transform hover:scale-105">
            <span className="font-extrabold text-4xl text-white tracking-tight">AY</span>
          </div>
          {/* Subtle pulse ring */}
          <div className="absolute inset-0 rounded-[32px] border-2 border-coral/40 animate-ping pointer-events-none" />
        </div>

        {/* Brand Name & Telemetry Tag */}
        <h1 className="text-3xl font-extrabold tracking-tight text-ink mb-1">Ayu</h1>
        <p className="text-xs uppercase font-mono tracking-widest text-ink-mute font-semibold mb-6">
          Personal Health Telemetry
        </p>

        {/* Animated ECG / Telemetry Pulse */}
        <div className="w-36 h-8 flex items-center justify-center">
          <svg viewBox="0 0 140 32" className="w-full h-full overflow-visible">
            <polyline
              points="0,16 40,16 50,4 60,28 70,8 80,24 90,16 140,16"
              fill="none"
              stroke="#FF5C35"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* User Greeting */}
        <div className="mt-8 text-xs font-semibold text-ink-mute">
          Telemetry Ready · Welcome Surya
        </div>
      </div>
    </div>
  );
};
