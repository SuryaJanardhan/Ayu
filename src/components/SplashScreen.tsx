import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 320);
    const doneTimer = setTimeout(() => onFinish(), 500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-50 bg-[#FFF9F3] flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200 ease-out will-change-[opacity] ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-[26px] bg-gradient-to-tr from-coral to-[#FF2D75] flex items-center justify-center shadow-[0_10px_24px_rgba(255,92,53,0.28)] mb-4">
          <span className="font-extrabold text-3xl text-white tracking-tight">AY</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Ayu</h1>
        <p className="text-[11px] uppercase font-mono tracking-widest text-ink-mute font-semibold mt-0.5">
          Personal Telemetry
        </p>
      </div>
    </div>
  );
};
