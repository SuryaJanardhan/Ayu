import fs from 'fs';
import path from 'path';

// Clean SVG for app icon (Warm coral gradient with AY text)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="coralGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF5C35"/>
      <stop offset="100%" stop-color="#FF2D75"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="240" fill="url(#coralGrad)"/>
  <text x="512" y="610" text-anchor="middle" font-family="Inter, sans-serif" font-size="360" font-weight="900" fill="#FFFFFF" letter-spacing="-10">AY</text>
  <polyline points="200,800 420,800 470,720 520,860 570,760 620,820 824,820" fill="none" stroke="#FFFFFF" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
</svg>`;

// Clean SVG for splash screen (Warm cream background with icon and title)
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <rect width="1284" height="2778" fill="#FFF9F3"/>
  <g transform="translate(492, 1089)">
    <defs>
      <linearGradient id="splashGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FF5C35"/>
        <stop offset="100%" stop-color="#FF2D75"/>
      </linearGradient>
    </defs>
    <rect width="300" height="300" rx="72" fill="url(#splashGrad)"/>
    <text x="150" y="180" text-anchor="middle" font-family="Inter, sans-serif" font-size="110" font-weight="900" fill="#FFFFFF" letter-spacing="-3">AY</text>
  </g>
  <text x="642" y="1470" text-anchor="middle" font-family="Inter, sans-serif" font-size="64" font-weight="900" fill="#1A1033" letter-spacing="-1">Ayu</text>
  <text x="642" y="1520" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="24" font-weight="700" fill="#7A6F8F" letter-spacing="6">PERSONAL TELEMETRY</text>
</svg>`;

fs.writeFileSync('assets/icon.svg', iconSvg);
fs.writeFileSync('assets/splash.svg', splashSvg);
console.log('Saved SVG icon and splash assets.');
