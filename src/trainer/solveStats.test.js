import { averageOf, formatSolve, formatTime, getSolveStats } from './solveStats';

const solves = values => values.map((time, i) => ({ id: String(i), time, penalty: 'OK' }));

test('ao5 trims fastest and slowest and applies +2 before trimming', () => {
  const records = solves([1000, 2000, 3000, 4000, 10000]);
  expect(averageOf(records, 5)).toBe(3000);
  records[1].penalty = '+2';
  expect(averageOf(records, 5)).toBeCloseTo(11000 / 3);
  expect(averageOf(records.slice(0, 4), 5)).toBeNull();
});

test('one DNF is discarded in ao5/ao12; two yield DNF; mo3 keeps every solve', () => {
  const records = solves(Array.from({ length: 12 }, (_, i) => (i + 1) * 1000));
  records[0].penalty = 'DNF';
  expect(averageOf(records, 5)).toBe(4000);
  expect(averageOf(records, 12)).toBe(7500);
  expect(averageOf(records, 3)).toBe(Infinity);
  records[1].penalty = 'DNF';
  expect(averageOf(records, 5)).toBe(Infinity);
  expect(averageOf(records, 12)).toBe(Infinity);
});

test('computes rolling current/best, valid mean, deviation, and trend', () => {
  const records = solves([1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]);
  const stats = getSolveStats(records);
  expect(stats.current.ao5).toBe(3000);
  expect(stats.bestAverages.ao5).toBe(3000);
  expect(stats.windows[1].ao5).toBe(4000);
  expect(stats.mean).toBe(5500);
  expect(stats.deviation).toBeCloseTo(2872.2813);
  expect(stats.trend).toBeCloseTo(-62.5);
  records[0].penalty = 'DNF';
  expect(getSolveStats(records).best).toBe(2000);
  expect(getSolveStats(records).dnfCount).toBe(1);
  expect(getSolveStats([]).mean).toBeNull();
});

test('formats missing, DNF, penalties, and minute durations', () => {
  expect(formatTime(null)).toBe('--');
  expect(formatTime(Infinity)).toBe('DNF');
  expect(formatTime(61239)).toBe('1:01.23');
  expect(formatSolve({ time: 1234, penalty: '+2' })).toBe('3.23+');
});
