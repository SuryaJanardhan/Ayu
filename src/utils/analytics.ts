/**
 * Computes simple or exponential 7-day rolling moving average for weight data.
 */
export function calculate7DayMovingAverage(
  records: { date: string; weight: number }[]
): { date: string; weight: number; moving_avg: number }[] {
  if (!records || records.length === 0) return [];

  // Sort ascending by date
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  return sorted.map((item, index) => {
    // Collect window of up to 7 days including current
    const start = Math.max(0, index - 6);
    const window = sorted.slice(start, index + 1);
    const sum = window.reduce((acc, curr) => acc + curr.weight, 0);
    const avg = Number((sum / window.length).toFixed(2));
    return {
      date: item.date,
      weight: item.weight,
      moving_avg: avg,
    };
  });
}

/**
 * Calculates daily energy balance and progress status.
 */
export function calculateEnergyBalance(consumed: number, target: number) {
  const diff = consumed - target;
  let status: 'under' | 'on_track' | 'surplus' = 'on_track';
  if (diff < -150) status = 'under';
  else if (diff > 150) status = 'surplus';

  return {
    consumed,
    target,
    diff,
    percentage: target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0,
    status,
  };
}
