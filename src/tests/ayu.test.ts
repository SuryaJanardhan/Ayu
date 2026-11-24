import { describe, it, expect } from 'vitest';
import { normalizeMealPhrase } from '../utils/normalizer';
import { calculate7DayMovingAverage, calculateEnergyBalance } from '../utils/analytics';
import { shiftDate, getTodayDateString } from '../utils/date';
import { getFoodImageFallback } from '../utils/imageOptimizer';
import { compressSnapshotData, decompressSnapshotData } from '../utils/compression';

describe('Ayu Core Utilities & Telemetry Logic', () => {
  describe('Meal Phrase Normalization (Deterministic Cache Key)', () => {
    it('normalizes uppercase and mixed casing', () => {
      expect(normalizeMealPhrase('2 EGGS ON TOAST')).toBe('2 eggs on toast');
      expect(normalizeMealPhrase('Chicken Breast & Rice')).toBe('chicken breast rice');
    });

    it('strips redundant whitespace and edge spaces', () => {
      expect(normalizeMealPhrase('   oatmeal   with    almond   milk   ')).toBe('oatmeal with almond milk');
    });

    it('strips punctuation and special symbols', () => {
      expect(normalizeMealPhrase('Protein Shake (30g) + Banana!')).toBe('protein shake 30g banana');
    });

    it('produces identical normalized keys for repeated real-world entries', () => {
      const phrase1 = '2 eggs on sourdough toast!';
      const phrase2 = '  2  Eggs on Sourdough  Toast   ';
      expect(normalizeMealPhrase(phrase1)).toBe(normalizeMealPhrase(phrase2));
    });
  });

  describe('Image Optimization & Food Presets', () => {
    it('resolves correct default SVG illustrations for staple meals', () => {
      expect(getFoodImageFallback('2 eggs on sourdough toast')).toContain('data:image/svg+xml');
      expect(getFoodImageFallback('chicken breast with white rice')).toContain('data:image/svg+xml');
      expect(getFoodImageFallback('whey protein shake')).toContain('data:image/svg+xml');
      expect(getFoodImageFallback('greek yogurt and berries')).toContain('data:image/svg+xml');
      expect(getFoodImageFallback('unknown exotic meal')).toContain('data:image/svg+xml');
    });
  });

  describe('Two-Tier Storage Compression & Decompression', () => {
    it('compresses and safely reconstructs snapshot payloads without data loss', async () => {
      const mockVault = {
        version: 2,
        meals: [
          { id: 1, name: 'Eggs on toast', calories: 340, image: 'data:image/jpeg;base64,sample' },
          { id: 2, name: 'Chicken rice', calories: 520, image: 'data:image/jpeg;base64,sample2' },
        ],
        workouts: [{ id: 1, name: 'Push day', sets: 4 }],
        weights: [74.5, 74.2, 73.8],
      };

      const compressed = await compressSnapshotData(mockVault);
      expect(compressed.compressedData).toBeDefined();
      expect(compressed.compressedData.length).toBeGreaterThan(0);
      expect(compressed.originalBytes).toBeGreaterThan(0);

      const decompressed = await decompressSnapshotData(compressed.compressedData);
      expect(decompressed).toEqual(mockVault);
      expect(decompressed.meals.length).toBe(2);
      expect(decompressed.meals[0].calories).toBe(340);
    });
  });

  describe('7-Day Weight Moving Average (Noise Smoothing)', () => {
    it('returns empty array when input is empty', () => {
      expect(calculate7DayMovingAverage([])).toEqual([]);
    });

    it('computes rolling average correctly across single and multiple days', () => {
      const records = [
        { date: '2026-11-18', weight: 75.0 },
        { date: '2026-11-19', weight: 74.0 },
        { date: '2026-11-20', weight: 73.0 },
      ];
      const result = calculate7DayMovingAverage(records);
      expect(result.length).toBe(3);
      expect(result[0].moving_avg).toBe(75.0);
      expect(result[1].moving_avg).toBe(74.5);
      expect(result[2].moving_avg).toBe(74.0);
    });

    it('caps the rolling window at exactly 7 days', () => {
      const records = [
        { date: '2026-11-01', weight: 70 },
        { date: '2026-11-02', weight: 70 },
        { date: '2026-11-03', weight: 70 },
        { date: '2026-11-04', weight: 70 },
        { date: '2026-11-05', weight: 70 },
        { date: '2026-11-06', weight: 70 },
        { date: '2026-11-07', weight: 70 },
        { date: '2026-11-08', weight: 80 },
      ];
      const result = calculate7DayMovingAverage(records);
      expect(result[7].moving_avg).toBe(71.43);
    });
  });

  describe('Energy Balance and Targets', () => {
    it('identifies calorie deficit (under target)', () => {
      const res = calculateEnergyBalance(1800, 2200);
      expect(res.status).toBe('under');
      expect(res.diff).toBe(-400);
      expect(res.percentage).toBe(82);
    });

    it('identifies calorie surplus', () => {
      const res = calculateEnergyBalance(2500, 2200);
      expect(res.status).toBe('surplus');
      expect(res.diff).toBe(300);
    });

    it('identifies on-track maintenance range within +/- 150 kcal', () => {
      const res = calculateEnergyBalance(2150, 2200);
      expect(res.status).toBe('on_track');
    });
  });

  describe('Date Utilities', () => {
    it('shifts dates forwards and backwards accurately', () => {
      expect(shiftDate('2026-11-24', 1)).toBe('2026-11-25');
      expect(shiftDate('2026-11-24', -1)).toBe('2026-11-23');
      expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31');
    });

    it('produces valid YYYY-MM-DD for today', () => {
      const today = getTodayDateString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
