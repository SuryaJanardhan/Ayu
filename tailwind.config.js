/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDFB',
          100: '#FFF9F3',
          200: '#F3E4D8',
          300: '#E7D0C0',
        },
        ink: {
          DEFAULT: '#1A1033',
          mute: '#7A6F8F',
          light: '#9E94B3',
        },
        coral: {
          DEFAULT: '#FF5C35',
          light: '#FFE4D9',
          hover: '#E04A25',
        },
        sun: {
          DEFAULT: '#FFC400',
          light: '#FFF3C4',
        },
        sky: {
          DEFAULT: '#2F6BFF',
          light: '#DDE7FF',
        },
        rose: {
          DEFAULT: '#FF2D75',
          light: '#FFE3E3',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        fab: '0 6px 16px rgba(255, 92, 53, 0.4)',
        card: '0 2px 8px rgba(26, 16, 51, 0.04)',
      }
    },
  },
  plugins: [],
}
