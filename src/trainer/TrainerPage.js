import React, { useEffect, useMemo, useState } from 'react';
import Cube2DView from './Cube2DView';
import { CASE_LIBRARY, BASE_PRESETS } from './caseLibrary';
import { getCstimerCasePreview, getPreviewColor } from './cstimerCasePreview';
import { buildTrainingScramble } from './trainingGenerator';

const METHOD_OPTIONS = {
  EG: ['EG-1', 'EG-2', 'LEG-1', 'CLL'],
  TCLL: ['TCLL+', 'TCLL-'],
  LS: ['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9'],
};

const INSPECTION_MS = 15000;
const NORMAL_READY_MS = 500;
const INSPECTION_READY_MS = 100;

function CasePreview({ methodGroup, method, name }) {
  const preview = getCstimerCasePreview(methodGroup, method, name);

  return (
    <div className="case-preview cstimer-ll-preview" aria-hidden="true">
      {preview.map((code, i) => (
        <span key={`${code}-${i}`} style={{ background: getPreviewColor(code) }} />
      ))}
    </div>
  );
}

export default function TrainerPage() {
  const [methodGroup, setMethodGroup] = useState('EG');
  const [method, setMethod] = useState('EG-1');
  const [caseIdx, setCaseIdx] = useState(0);

  const [base, setBase] = useState('');
  const [useCustomBase, setUseCustomBase] = useState(false);
  const [customBase, setCustomBase] = useState('');
  const [defaultBase, setDefaultBase] = useState('');

  const [forceTrailingR, setForceTrailingR] = useState(true);
  const [scramble, setScramble] = useState('');
  const [forwardSeq, setForwardSeq] = useState('');

  // timer phase: idle | inspection | ready | running
  const [timerPhase, setTimerPhase] = useState('idle');
  const [enableInspection, setEnableInspection] = useState(true);
  const [inspectionLeftMs, setInspectionLeftMs] = useState(INSPECTION_MS);
  const [inspectionStartTs, setInspectionStartTs] = useState(0);

  const [startTs, setStartTs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [records, setRecords] = useState([]);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [showCubeModal, setShowCubeModal] = useState(false);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [spaceDownAt, setSpaceDownAt] = useState(0);
  const [readyMs, setReadyMs] = useState(NORMAL_READY_MS);
  const [readyColor, setReadyColor] = useState('red'); // red | green
  const [runOffsetMs, setRunOffsetMs] = useState(0);

  const methods = METHOD_OPTIONS[methodGroup];
  const caseList = (CASE_LIBRARY[methodGroup] && CASE_LIBRARY[methodGroup][method]) || [];
  const selectedCase = caseList[caseIdx];

  useEffect(() => {
    if (!methods.includes(method)) setMethod(methods[0]);
  }, [methodGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCaseIdx(0);
  }, [methodGroup, method]);

  // running timer: 正向累加每 10ms 更新
  useEffect(() => {
    if (timerPhase !== 'running') return;
    const h = setInterval(() => setElapsedMs(runOffsetMs + Date.now() - startTs), 10);
    return () => clearInterval(h);
  }, [timerPhase, startTs, runOffsetMs]);

  // inspection timer: 15s 整数倒计时，首次松开不暂停
  useEffect(() => {
    if (timerPhase !== 'inspection' && timerPhase !== 'ready') return;
    if (inspectionStartTs <= 0) return;

    const updateInspection = () => {
      const left = Math.max(0, INSPECTION_MS - (Date.now() - inspectionStartTs));
      setInspectionLeftMs(left);
      if (left <= 0) {
        setTimerPhase('idle');
        setSpaceHeld(false);
        setReadyColor('red');
      }
    };

    updateInspection();
    const h = setInterval(updateInspection, 100);
    return () => clearInterval(h);
  }, [timerPhase, inspectionStartTs]);

  useEffect(() => {
    if (timerPhase !== 'ready') return;

    const updateReadyColor = () => {
      const holdMs = Date.now() - spaceDownAt;
      const isReady = holdMs >= readyMs;
      setReadyColor(isReady ? 'green' : 'red');
    };

    updateReadyColor();
    const h = setInterval(updateReadyColor, 10);
    return () => clearInterval(h);
  }, [timerPhase, spaceDownAt, readyMs]);

  useEffect(() => {
    const isTypingTarget = (target) => {
      const tag = (target?.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || target?.isContentEditable;
    };

    const startRunning = () => {
      setRunOffsetMs(0);
      setStartTs(Date.now());
      setElapsedMs(0);
      setTimerPhase('running');
      setSpaceHeld(false);
      setSpaceDownAt(0);
      setInspectionStartTs(0);
      setInspectionLeftMs(INSPECTION_MS);
      setReadyColor('red');
    };

    const resetReady = (holdMs) => {
      setSpaceHeld(true);
      setSpaceDownAt(Date.now());
      setReadyMs(holdMs);
      setReadyColor('red');
      setTimerPhase('ready');
    };

    const onKeyDown = (e) => {
      if (isTypingTarget(e.target)) return;
      if (e.code !== 'Space' || e.repeat || spaceHeld) return;

      e.preventDefault();
      if (!scramble) return;

      if (timerPhase === 'idle') {
        if (enableInspection) {
          setInspectionStartTs(Date.now());
          setInspectionLeftMs(INSPECTION_MS);
          setSpaceHeld(true);
          setTimerPhase('inspection');
          return;
        }
        resetReady(NORMAL_READY_MS);
        return;
      }

      if (timerPhase === 'inspection') {
        resetReady(INSPECTION_READY_MS);
        return;
      }

      if (timerPhase === 'running') {
        const t = runOffsetMs + Date.now() - startTs;
        setTimerPhase('idle');
        setElapsedMs(t);
        setRunOffsetMs(0);
        setSpaceHeld(false);
        setReadyColor('red');
        setRecords((r) => [
          { time: t, method, at: new Date().toLocaleTimeString(), scramble },
          ...r,
        ].slice(0, 50));
      }
    };

    const onKeyUp = (e) => {
      if (isTypingTarget(e.target)) return;
      if (e.code !== 'Space') return;
      e.preventDefault();

      if (timerPhase === 'inspection') {
        setSpaceHeld(false);
        return;
      }

      if (timerPhase === 'ready') {
        const canStart = Date.now() - spaceDownAt >= readyMs;
        setSpaceHeld(false);

        if (!canStart) {
          setTimerPhase(enableInspection ? 'inspection' : 'idle');
          setReadyColor('red');
          return;
        }

        startRunning();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [timerPhase, enableInspection, startTs, scramble, method, spaceDownAt, readyMs, inspectionLeftMs, runOffsetMs, spaceHeld]);

  const gen = () => {
    const picked = caseList[caseIdx];
    if (!picked) return;
    const baseToUse = useCustomBase ? customBase.trim() : base;
    const basePrefix = defaultBase.trim();
    const setupPrefix = [basePrefix, baseToUse].filter(Boolean).join(' ').trim();
    const { scramble: s, forward } = buildTrainingScramble({
      setup: setupPrefix,
      base: '',
      alg: picked.alg,
      addRandomAuf: true,
      forceTrailingR,
    });
    setScramble(s);
    setForwardSeq(forward);

    setTimerPhase('idle');
    setElapsedMs(0);
    setRunOffsetMs(0);
    setInspectionStartTs(0);
    setInspectionLeftMs(INSPECTION_MS);
    setSpaceHeld(false);
    setReadyColor('red');
  };

  const fmt = (ms) => (ms / 1000).toFixed(2);
  const pb = useMemo(
    () => (records.length ? Math.min(...records.map((x) => x.time)) : null),
    [records]
  );

  const timerDisplay =
    timerPhase === 'inspection' || (timerPhase === 'ready' && enableInspection)
      ? String(Math.ceil(inspectionLeftMs / 1000))
      : fmt(elapsedMs);
  const timerClassName = [
    'time',
    timerPhase === 'running' ? 'running' : '',
    timerPhase === 'ready' && readyColor === 'red' ? 'ready-red' : '',
    timerPhase === 'ready' && readyColor === 'green' ? 'ready-green' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="app trainer-shell">
      <header className="topbar">
        <div className="brand-mark">1</div>
        <h1>One-Look Trainer</h1>
        <div className="topbar-actions">
          <button type="button" className="icon-button" onClick={() => setShowCubeModal(true)}>六面</button>
          <span>?</span>
        </div>
      </header>

      {showCasePicker && (
        <div className="case-picker-backdrop" role="dialog" aria-modal="true" aria-label="选择训练公式">
          <div className="case-picker-modal">
            <div className="case-picker-header">
              <div>
                <h2>选择训练公式</h2>
                <p>{methodGroup} / {method} · 参考 csTimer 的 case 过滤训练方式，选择一个公式后生成对应训练打乱</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowCasePicker(false)}>×</button>
            </div>

            <div className="case-picker-grid">
              {caseList.map((c, i) => (
                <button
                  type="button"
                  key={`${c.name}-${i}`}
                  className={`case-card ${i === caseIdx ? 'selected' : ''}`}
                  onClick={() => {
                    setCaseIdx(i);
                    setShowCasePicker(false);
                  }}
                >
                  <CasePreview methodGroup={methodGroup} method={method} name={c.name} />
                  <span className="case-card-name">{c.name}</span>
                  <span className="case-card-alg">{c.alg}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="trainer-layout">
        <aside className="left-rail">
          <section className="panel settings-panel">
            <h2>Settings</h2>

            <div className="row">
              <label>方法组</label>
              <select value={methodGroup} onChange={(e) => setMethodGroup(e.target.value)}>
                {Object.keys(METHOD_OPTIONS).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="row">
              <label>子类</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                {methods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="row case-picker-row">
              <label>公式 Case</label>
              <button type="button" className="case-picker-trigger" onClick={() => setShowCasePicker(true)}>
                <span className="case-picker-title">{selectedCase ? selectedCase.name : '请选择公式'}</span>
                <span className="case-picker-alg">{selectedCase ? selectedCase.alg : '当前分类暂无公式'}</span>
              </button>
            </div>

            <div className="row">
              <label>默认打乱前缀</label>
              <select value={defaultBase} onChange={(e) => setDefaultBase(e.target.value)}>
                {BASE_PRESETS.map((b) => (
                  <option key={b.name} value={b.face}>
                    {b.name}{b.face ? ` (${b.face})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <label>做底预设</label>
              <select value={base} onChange={(e) => setBase(e.target.value)}>
                {BASE_PRESETS.map((b) => (
                  <option key={b.name} value={b.face}>
                    {b.name}{b.face ? ` (${b.face})` : ''}
                  </option>
                ))}
              </select>
            </div>


            <div className="row checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={useCustomBase}
                  onChange={(e) => setUseCustomBase(e.target.checked)}
                />
                使用自定义做底
              </label>
            </div>

            {useCustomBase && (
              <div className="row">
                <label>自定义做底</label>
                <input
                  value={customBase}
                  onChange={(e) => setCustomBase(e.target.value)}
                  placeholder="例如 R U R'"
                />
              </div>
            )}

            <div className="row checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={forceTrailingR}
                  onChange={(e) => setForceTrailingR(e.target.checked)}
                />
                末尾强制 + R（兜底）
              </label>
            </div>

            <div className="row checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={enableInspection}
                  onChange={(e) => setEnableInspection(e.target.checked)}
                />
                启用 15s 观察
              </label>
            </div>

            <button className="primary-button" onClick={gen}>生成训练打乱</button>
          </section>

          <button type="button" className="secondary-button" onClick={() => setShowCubeModal((show) => !show)}>
            {showCubeModal ? '隐藏六面颜色状态' : '查看六面颜色状态'}
          </button>

          <div className="panel records-panel">
            <h2>最近成绩</h2>
            <ol>
              {records.map((r, i) => (
                <li key={`${r.at}-${i}`}>
                  {fmt(r.time)}s - {r.method} - {r.at}
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <section className="right-stage">
          {scramble && (
            <div className="panel scramble-panel">
              <h2>Scramble</h2>
              <div className="scramble">{scramble}</div>
              <div className="hint">空格键：按住准备 / 松开开跑 / 运行中停止</div>
            </div>
          )}

          <div className="panel timer">
            {showCubeModal && timerPhase === 'idle' && (
              <div className="cube-panel timer-cube-overlay" role="region" aria-label="六面颜色状态">
                <Cube2DView scramble={scramble} />
              </div>
            )}
            <div className={timerClassName}>
              {timerDisplay}
            </div>
            <div className="best">
              PB: {pb == null ? '--' : `${fmt(pb)}s`}
              {timerPhase === 'ready' ? ' · 松开空格开始计时' : ''}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}