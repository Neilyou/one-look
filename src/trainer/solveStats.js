export function solveValue(record) {
  return record.penalty === 'DNF' ? Infinity : record.time + (record.penalty === '+2' ? 2000 : 0);
}

export function formatTime(value) {
  if (value == null) return '--';
  if (!Number.isFinite(value)) return 'DNF';
  const centiseconds = Math.floor(value / 10);
  const seconds = (centiseconds % 6000) / 100;
  return centiseconds >= 6000
    ? `${Math.floor(centiseconds / 6000)}:${seconds.toFixed(2).padStart(5, '0')}`
    : seconds.toFixed(2);
}

export function formatSolve(record) {
  return `${formatTime(solveValue(record))}${record.penalty === '+2' ? '+' : ''}`;
}

// Records are newest first. WCA averages discard ceil(5%) at each end.
export function averageOf(records, size) {
  if (records.length < size) return null;
  const values = records.slice(0, size).map(solveValue).sort((a, b) => a - b);
  const trim = size >= 5 ? Math.ceil(size * 0.05) : 0;
  const kept = values.slice(trim, size - trim);
  if (kept.some(value => !Number.isFinite(value))) return Infinity;
  return kept.reduce((sum, value) => sum + value, 0) / kept.length;
}

export function getSolveStats(records) {
  const valid = records.map(solveValue).filter(Number.isFinite);
  const mean = valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
  const windows = records.map((_, i) => ({
    mo3: averageOf(records.slice(i, i + 3), 3),
    ao5: averageOf(records.slice(i, i + 5), 5),
    ao12: averageOf(records.slice(i, i + 12), 12),
  }));
  const best = (key) => {
    const values = windows.map(window => window[key]).filter(value => value != null);
    return values.length ? Math.min(...values) : null;
  };
  const recent = averageOf(records, 5);
  const previous = averageOf(records.slice(5), 5);
  return {
    count: records.length, validCount: valid.length,
    dnfCount: records.length - valid.length,
    best: valid.length ? Math.min(...valid) : null,
    worst: valid.length ? Math.max(...valid) : null,
    mean,
    deviation: mean == null ? null : Math.sqrt(valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) / valid.length),
    current: windows[0] || {},
    bestAverages: { mo3: best('mo3'), ao5: best('ao5'), ao12: best('ao12') },
    trend: Number.isFinite(recent) && Number.isFinite(previous) && previous > 0
      ? (recent - previous) / previous * 100 : null,
    windows,
  };
}
