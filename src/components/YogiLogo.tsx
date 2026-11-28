import React from 'react';

interface YogiLogoProps {
  size?: number;
  className?: string;
}

/**
 * Padmasana (lotus pose) Yogi emblem for Ayu.
 */
export const YogiLogo: React.FC<YogiLogoProps> = ({ size = 44, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Ayu Padmasana Yogi"
    >
      {/* Subtle aura halo */}
      <circle cx="32" cy="18" r="10" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.75" />
      {/* Head */}
      <circle cx="32" cy="18" r="5.5" fill="currentColor" />
      {/* Topknot / crown */}
      <circle cx="32" cy="10.8" r="2.1" fill="currentColor" />
      {/* Torso & shoulders */}
      <path
        d="M23 30C23 26.2 26.8 24.5 32 24.5C37.2 24.5 41 26.2 41 30L38.2 41.5H25.8L23 30Z"
        fill="currentColor"
      />
      {/* Arms resting in Dhyana / Chin mudra */}
      <path
        d="M23.5 29.5L16.5 39.5C15.8 40.5 16.5 42 17.8 42H23.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40.5 29.5L47.5 39.5C48.2 40.5 47.5 42 46.2 42H40.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crossed Padmasana legs */}
      <path
        d="M15 47.5C15 44 19 42.5 25 43.2L32 44.5L39 43.2C45 42.5 49 44 49 47.5C49 50.5 43.5 52 32 52C20.5 52 15 50.5 15 47.5Z"
        fill="currentColor"
      />
      {/* Lotus base line */}
      <path
        d="M20 55.5H44"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
