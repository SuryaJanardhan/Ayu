import React, { useEffect, useState } from 'react';
import { YogiLogo } from './YogiLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 280);
    const doneTimer = setTimeout(() => onFinish(), 440);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-50 bg-[#FFF9F3] flex flex-col items-center justify-center cursor-pointer transition-opacity duration-150 ease-out will-change-[opacity] ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-yogi-pop">
        <div className="relative mb-3">
          <div className="absolute inset-0 rounded-[28px] border-2 border-coral/50 animate-aura-wave pointer-events-none" />
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-coral to-[#FF7A45] flex items-center justify-center shadow-[0_12px_28px_rgba(255,92,53,0.3)] text-white">
            <YogiLogo size={46} />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Ayu</h1>
      </div>
    </div>
  );
};
