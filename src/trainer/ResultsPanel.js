import React, { useEffect, useMemo, useRef, useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { formatSolve, formatTime, getSolveStats, solveValue } from './solveStats';

function ResultDialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const node = ref.current;
    node.querySelector('button')?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
      if (event.key !== 'Tab') return;
      const focusable = [...node.querySelectorAll('button:not(:disabled),select,a[href]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    node.addEventListener('keydown', keydown);
    return () => { node.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [onClose]);
  return <div className="case-picker-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={ref} className="result-dialog" role="dialog" aria-modal="true" aria-label={title}>
      <header className="results-heading"><h2>{title}</h2><button className="result-icon" onClick={onClose} title="关闭" aria-label="关闭"><CloseIcon /></button></header>
      {children}
    </section>
  </div>;
}

function TrendChart({ records }) {
  const recent = records.slice(0, 50).reverse();
  const values = recent.map(solveValue).filter(Number.isFinite);
  if (recent.length < 2 || !values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1000);
  const x = i => 12 + i / (recent.length - 1) * 336;
  const y = value => 70 - (value - min) / range * 54;
  let path = '';
  let connected = false;
  recent.forEach((record, i) => {
    const value = solveValue(record);
    if (!Number.isFinite(value)) { connected = false; return; }
    path += `${connected ? 'L' : 'M'}${x(i)},${y(value)} `;
    connected = true;
  });
  return <figure className="solve-trend">
    <figcaption><span>最近 {recent.length} 次</span><span>{formatTime(min)} – {formatTime(max)} s</span></figcaption>
    <svg viewBox="0 0 360 86" role="img" aria-label="最近成绩趋势，横轴由早到晚，纵轴为用时">
      <path d="M12 70H348 M12 16H348" className="trend-grid" />
      <path d={path} className="trend-line" />
      {recent.map((record, i) => Number.isFinite(solveValue(record))
        ? <circle key={record.id} cx={x(i)} cy={y(solveValue(record))} r="2.7" className="trend-dot"><title>{formatSolve(record)}</title></circle>
        : <text key={record.id} x={x(i)} y="81" textAnchor="middle" className="trend-dnf">×<title>DNF</title></text>)}
    </svg>
  </figure>;
}

export default function ResultsPanel({ records, onPenalty, onDelete, onClear, filter, onFilter, methodGroup, method, onDialogChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => filter === 'method' ? records.filter(record => record.methodGroup === methodGroup && record.method === method) : records, [records, filter, methodGroup, method]);
  const stats = useMemo(() => getSolveStats(filtered), [filtered]);
  const selected = records.find(record => record.id === selectedId);
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages - 1);
  useEffect(() => { setPage(0); }, [filter, methodGroup, method]);
  useEffect(() => { onDialogChange(Boolean(selected || confirmClear)); return () => onDialogChange(false); }, [selected, confirmClear, onDialogChange]);
  const closeDetail = React.useCallback(() => { setSelectedId(null); setConfirmDelete(false); }, []);
  const closeClear = React.useCallback(() => setConfirmClear(false), []);
  const exportRecords = () => {
    const rows = [['#', 'time', 'raw_ms', 'penalty', 'method_group', 'method', 'date', 'scramble'], ...filtered.slice().reverse().map((record, i) => [i + 1, formatSolve(record), record.time, record.penalty, record.methodGroup, record.method, new Date(record.timestamp).toISOString(), record.scramble])];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `one-look-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="records-panel" aria-label="成绩与统计">
    <header className="results-heading">
      <h2>最近成绩 <span className="solve-count" title="有效成绩 / 总次数">{stats.validCount} / {stats.count}</span></h2>
      <div className="result-actions">
        <button className="result-icon" title="导出当前成绩 CSV" aria-label="导出当前成绩 CSV" disabled={!filtered.length} onClick={exportRecords}><DownloadIcon /></button>
        <button className="result-icon" title="清空当前成绩" aria-label="清空当前成绩" disabled={!filtered.length} onClick={() => setConfirmClear(true)}><DeleteOutlineIcon /></button>
      </div>
    </header>
    <select className="results-filter" aria-label="成绩范围" value={filter} onChange={event => onFilter(event.target.value)}>
      <option value="all">全部训练</option><option value="method">{methodGroup} / {method}</option>
    </select>
    <table className="stats-table" aria-label="成绩统计">
      <thead><tr><th>统计</th><th>当前</th><th>最佳</th></tr></thead>
      <tbody>
        <tr><th>单次</th><td>{filtered[0] ? formatSolve(filtered[0]) : '--'}</td><td>{formatTime(stats.best)}</td></tr>
        {['mo3', 'ao5', 'ao12'].map(key => <tr key={key}><th>{key}</th><td>{formatTime(stats.current[key])}</td><td>{formatTime(stats.bestAverages[key])}</td></tr>)}
      </tbody>
    </table>
    <details className="results-analysis" open>
      <summary>简要分析</summary>
      <dl><div><dt>有效均值</dt><dd>{formatTime(stats.mean)}</dd></div><div><dt>标准差</dt><dd>{formatTime(stats.deviation)}</dd></div><div><dt>最慢有效</dt><dd>{formatTime(stats.worst)}</dd></div><div><dt>DNF</dt><dd>{stats.dnfCount}{stats.count > 0 ? ` (${(stats.dnfCount / stats.count * 100).toFixed(0)}%)` : ''}</dd></div></dl>
      {stats.trend != null && <p className={stats.trend <= 0 ? 'trend-better' : 'trend-worse'}>最近 ao5 较前 5 次{stats.trend < 0 ? '快' : stats.trend > 0 ? '慢' : '持平'}{stats.trend === 0 ? '' : ` ${Math.abs(stats.trend).toFixed(1)}%`}</p>}
      <TrendChart records={filtered} />
    </details>
    <div className="results-table-wrap">
      <table className="solves-table" aria-label="最近成绩">
        <thead><tr><th>#</th><th>成绩</th><th>ao5</th><th>ao12</th></tr></thead>
        <tbody>{filtered.slice(currentPage * 20, currentPage * 20 + 20).map((record, index) => {
          const offset = currentPage * 20 + index;
          return <tr key={record.id} className={solveValue(record) === stats.best ? 'solve-pb' : ''}>
            <td>{filtered.length - offset}</td><td><button className="solve-link" onClick={() => setSelectedId(record.id)} aria-label={`查看第 ${filtered.length - offset} 次成绩 ${formatSolve(record)}`}>{formatSolve(record)}</button></td>
            <td>{formatTime(stats.windows[offset].ao5)}</td><td>{formatTime(stats.windows[offset].ao12)}</td>
          </tr>;
        })}</tbody>
      </table>
      {!filtered.length && <p className="results-empty">暂无成绩</p>}
    </div>
    {filtered.length > 20 && <nav className="results-pagination" aria-label="成绩分页"><button className="result-icon" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label="上一页" title="上一页"><ChevronLeftIcon /></button><span>{currentPage + 1} / {pages}</span><button className="result-icon" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)} aria-label="下一页" title="下一页"><ChevronRightIcon /></button></nav>}
    {selected && <ResultDialog title="成绩详情" onClose={closeDetail}>
      <div className="result-detail-time">{formatSolve(selected)}<small> s</small></div>
      <div className="penalty-options" role="group" aria-label="成绩判定">{['OK', '+2', 'DNF'].map(penalty => <button key={penalty} aria-pressed={selected.penalty === penalty} onClick={() => onPenalty(selected.id, penalty)}>{penalty}</button>)}</div>
      <dl className="result-details"><dt>训练</dt><dd>{selected.methodGroup} / {selected.method}</dd><dt>时间</dt><dd>{new Date(selected.timestamp).toLocaleString()}</dd><dt>原始用时</dt><dd>{formatTime(selected.time)} s</dd><dt>打乱</dt><dd className="detail-scramble">{selected.scramble}</dd></dl>
      {confirmDelete ? <div className="result-confirm"><p>删除这条成绩？此操作不可撤销。</p><button className="danger-action" onClick={() => { onDelete(selected.id); closeDetail(); }}>确认删除</button><button onClick={() => setConfirmDelete(false)}>取消</button></div> : <button className="danger-action" onClick={() => setConfirmDelete(true)}><DeleteOutlineIcon fontSize="small" />删除成绩</button>}
    </ResultDialog>}
    {confirmClear && <ResultDialog title="清空成绩" onClose={closeClear}><p>将删除{filter === 'method' ? ` ${methodGroup} / ${method} ` : '全部'}的 {filtered.length} 条成绩，设置不受影响。此操作不可撤销。</p><div className="result-confirm"><button className="danger-action" onClick={() => { onClear(filtered.map(record => record.id)); setConfirmClear(false); }}>确认清空</button><button onClick={closeClear}>取消</button></div></ResultDialog>}
  </section>;
}
