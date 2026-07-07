import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GitHubIcon from '@mui/icons-material/GitHub';
import Cube2DView from './Cube2DView';
import { CASE_LIBRARY, BASE_PRESETS } from './caseLibrary';
import { buildTrainingScramble, ORIENTATION_PRESETS } from './trainingGenerator';

// 将做底预设按 category 分组
function groupBasePresets(presets) {
  const map = new Map();
  presets.forEach((p) => {
    const cat = p.category || '其他';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(p);
  });
  return Array.from(map.entries());
}

const METHOD_OPTIONS = {
  EG: ['CLL', 'EG-1', 'EG-2', 'LEG-1', 'PBL'],
  TCLL: ['TCLL+', 'TCLL-'],
  LS: ['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9'],
};

const INSPECTION_MS = 15000;
const NORMAL_READY_MS = 500;
const INSPECTION_READY_MS = 100;


export default function TrainerPage() {
  const [methodGroup, setMethodGroup] = useState('EG');
  const [method, setMethod] = useState('EG-1');
  const [checkedIndices, setCheckedIndices] = useState(new Set());

  const [selectedBases, setSelectedBases] = useState(new Set());
  const [useCustomBase, setUseCustomBase] = useState(false);
  const [customBase, setCustomBase] = useState('');
  const [orientation, setOrientation] = useState('');
  const [scramble, setScramble] = useState('');
  const [forwardSeq, setForwardSeq] = useState('');

  const [timerPhase, setTimerPhase] = useState('idle');
  const [enableInspection, setEnableInspection] = useState(true);
  const [inspectionLeftMs, setInspectionLeftMs] = useState(INSPECTION_MS);
  const [inspectionStartTs, setInspectionStartTs] = useState(0);

  const [startTs, setStartTs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastTime, setLastTime] = useState(null);
  const [records, setRecords] = useState([]);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [showCubeModal, setShowCubeModal] = useState(false);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [showBasePicker, setShowBasePicker] = useState(false);
  const [spaceDownAt, setSpaceDownAt] = useState(0);
  const [readyMs, setReadyMs] = useState(NORMAL_READY_MS);
  const [readyColor, setReadyColor] = useState('red');
  const [runOffsetMs, setRunOffsetMs] = useState(0);

  const methods = METHOD_OPTIONS[methodGroup];
  const caseList = useMemo(
    () => (CASE_LIBRARY[methodGroup] && CASE_LIBRARY[methodGroup][method]) || [],
    [methodGroup, method]
  );
  const baseGroups = useMemo(() => groupBasePresets(BASE_PRESETS), []);

  // 做底全选/取消全选
  const allBasesChecked = useMemo(() => {
    const faces = BASE_PRESETS.filter(p => p.face);
    return faces.length > 0 && faces.every(p => selectedBases.has(p.face));
  }, [selectedBases]);

  const toggleAllBases = () => {
    if (allBasesChecked) {
      setSelectedBases(new Set());
    } else {
      setSelectedBases(new Set(BASE_PRESETS.filter(p => p.face).map(p => p.face)));
    }
  };

  const toggleBaseGroup = (presets) => {
    const faces = presets.filter(p => p.face).map(p => p.face);
    const allGroupChecked = faces.every(f => selectedBases.has(f));
    setSelectedBases(prev => {
      const next = new Set(prev);
      if (allGroupChecked) {
        faces.forEach(f => next.delete(f));
      } else {
        faces.forEach(f => next.add(f));
      }
      return next;
    });
  };

  const toggleSingleBase = (face) => {
    setSelectedBases(prev => {
      const next = new Set(prev);
      if (next.has(face)) next.delete(face);
      else next.add(face);
      return next;
    });
  };

  // 按 name 分组
  const caseGroups = useMemo(() => {
    const map = new Map();
    caseList.forEach((c, i) => {
      const key = c.name;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ ...c, idx: i });
    });
    return Array.from(map.entries());
  }, [caseList]);

  // 训练池：根据勾选生成
  const trainingPool = useMemo(() => {
    return caseList.filter((_, i) => checkedIndices.has(i));
  }, [caseList, checkedIndices]);

  // 修复方法选择
  useEffect(() => {
    if (!methods.includes(method)) setMethod(methods[0]);
  }, [methodGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  // 切换方法/方法组时清除勾选
  useEffect(() => {
    setCheckedIndices(new Set());
  }, [methodGroup, method]);

  // 新方法加载后，默认全选
  useEffect(() => {
    if (caseList.length > 0) {
      setCheckedIndices(new Set(caseList.map((_, i) => i)));
    }
  }, [method]); // eslint-disable-line react-hooks/exhaustive-deps

  // running timer
  useEffect(() => {
    if (timerPhase !== 'running') return;
    const h = setInterval(() => setElapsedMs(runOffsetMs + Date.now() - startTs), 10);
    return () => clearInterval(h);
  }, [timerPhase, startTs, runOffsetMs]);

  // inspection timer
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

  // ready color
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

  // keyboard
  useEffect(() => {
    const isTypingTarget = (target) => {
      const tag = (target?.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || target?.isContentEditable;
    };

    const startRunning = () => {
      setRunOffsetMs(0);
      setStartTs(Date.now());
      setElapsedMs(0);
      setLastTime(null);
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
        startRunning();
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
        setLastTime(t);
        setRunOffsetMs(0);
        setSpaceHeld(false);
        setReadyColor('red');
        setRecords((r) => [
          { time: t, method, at: new Date().toLocaleTimeString(), scramble },
          ...r,
        ].slice(0, 50));
        // 训练池 > 1 时，自动重新生成打乱
        if (trainingPool.length > 1) {
          setTimeout(() => genRef.current(), 0);
        }
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
  }, [timerPhase, enableInspection, startTs, scramble, method, spaceDownAt, readyMs, inspectionLeftMs, runOffsetMs, spaceHeld]); // eslint-disable-line react-hooks/exhaustive-deps

  const gen = useCallback(() => {
    if (trainingPool.length === 0) return;
    const picked = trainingPool[Math.floor(Math.random() * trainingPool.length)];
    const baseArr = useCustomBase ? [customBase.trim()] : [...selectedBases];
    const baseToUse = baseArr.length > 0 ? baseArr[Math.floor(Math.random() * baseArr.length)] : '';
    const setupPrefix = baseToUse;
    const { scramble: s, forward } = buildTrainingScramble({
      setup: setupPrefix,
      base: '',
      alg: picked.alg,
      addRandomAuf: false,
      orientation,
    });
    setScramble(s);
    setForwardSeq(forward);

    setTimerPhase('idle');
    setRunOffsetMs(0);
    setInspectionStartTs(0);
    setInspectionLeftMs(INSPECTION_MS);
    setSpaceHeld(false);
    setReadyColor('red');
  }, [trainingPool, useCustomBase, customBase, selectedBases, orientation]);

  // 参数变化时自动生成打乱
  useEffect(() => {
    gen();
  }, [gen]);

  // 用 ref 持有 gen，供键盘事件回调使用
  const genRef = useRef(gen);
  genRef.current = gen;

  const fmt = (ms) => (ms / 1000).toFixed(2);
  const pb = useMemo(
    () => (records.length ? Math.min(...records.map((x) => x.time)) : null),
    [records]
  );

  const timerDisplay =
    timerPhase === 'inspection' || (timerPhase === 'ready' && enableInspection)
      ? String(Math.ceil(inspectionLeftMs / 1000))
      : timerPhase === 'idle' && lastTime !== null
        ? fmt(lastTime)
        : fmt(elapsedMs);
  const timerClassName = [
    'time',
    timerPhase === 'running' ? 'running' : '',
    timerPhase === 'ready' && readyColor === 'red' ? 'ready-red' : '',
    timerPhase === 'ready' && readyColor === 'green' ? 'ready-green' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const checkedCount = checkedIndices.size;
  const allChecked = caseList.length > 0 && checkedCount === caseList.length;

  const toggleAllCases = () => {
    if (allChecked) {
      setCheckedIndices(new Set());
    } else {
      setCheckedIndices(new Set(caseList.map((_, i) => i)));
    }
  };

  const toggleGroupCases = (subcases) => {
    const groupIdxSet = new Set(subcases.map((s) => s.idx));
    const allGroupChecked = subcases.every((s) => checkedIndices.has(s.idx));
    setCheckedIndices((prev) => {
      const next = new Set(prev);
      if (allGroupChecked) {
        groupIdxSet.forEach((i) => next.delete(i));
      } else {
        groupIdxSet.forEach((i) => next.add(i));
      }
      return next;
    });
  };

  return (
    <div className="app trainer-shell">
      <header className="topbar">
        <div className="brand-mark">One-Look</div>
        <h1>One-Look Trainer</h1>
        <div className="topbar-actions">
          <a
            href="https://github.com/Neilyou/one-look"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-button"
            title="GitHub 开源项目"
          >
            <GitHubIcon style={{ fontSize: 24 }} />
          </a>
          <span>?</span>
        </div>
      </header>

      {showCasePicker && (
        <div className="case-picker-backdrop" role="dialog" aria-modal="true" aria-label="选择训练公式">
          <div className="case-picker-modal">
            <div className="case-picker-header">
              <div>
                <h2>选择训练公式</h2>
                <p>{methodGroup} / {method} · 勾选要练习的公式，支持多选</p>
              </div>
              <div className="case-picker-header-actions">
                <button
                  type="button"
                  className="case-picker-toggle-all"
                  onClick={toggleAllCases}
                >
                  {allChecked ? '取消全选' : '全选'}
                </button>
                <button type="button" className="modal-close" onClick={() => setShowCasePicker(false)}>×</button>
              </div>
            </div>

            <div className="case-picker-group-list">
              {caseGroups.map(([groupName, subcases], gi) => (
                <div
                  key={groupName}
                  className={gi > 0 ? 'case-picker-group case-picker-group-sep' : 'case-picker-group'}
                >
                  <div className="case-picker-group-header">
                    <span>{groupName}</span>
                    <button
                      type="button"
                      className="case-picker-group-toggle"
                      onClick={() => toggleGroupCases(subcases)}
                    >
                      {subcases.every((s) => checkedIndices.has(s.idx)) ? '取消' : '全选'}
                    </button>
                  </div>
                  <div className="case-picker-group-grid">
                    {subcases.map((s, si) => {
                      const displayNum = si + 1;
                      const isChecked = checkedIndices.has(s.idx);
                      return (
                        <button
                          type="button"
                          key={s.idx}
                          className={`case-picker-group-card ${isChecked ? 'checked' : ''}`}
                          onClick={() => {
                            setCheckedIndices((prev) => {
                              const next = new Set(prev);
                              if (next.has(s.idx)) next.delete(s.idx);
                              else next.add(s.idx);
                              return next;
                            });
                          }}
                        >
                          <div className="case-picker-group-card-check">
                            <input type="checkbox" checked={isChecked} readOnly tabIndex={-1} />
                            <span className="case-picker-group-card-label">#{displayNum}</span>
                          </div>
                          <span className="case-picker-group-card-alg">{s.alg}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showBasePicker && (
        <div className="case-picker-backdrop" role="dialog" aria-modal="true" aria-label="选择做底预设">
          <div className="case-picker-modal">
            <div className="case-picker-header">
              <div>
                <h2>选择做底预设</h2>
                <p>勾选要使用的做底，训练时将随机选择一个</p>
              </div>
              <div className="case-picker-header-actions">
                <button
                  type="button"
                  className="case-picker-toggle-all"
                  onClick={toggleAllBases}
                >
                  {allBasesChecked ? '取消全选' : '全选'}
                </button>
                <button type="button" className="modal-close" onClick={() => setShowBasePicker(false)}>×</button>
              </div>
            </div>
            <div className="case-picker-group-list">
              {baseGroups.map(([category, presets], gi) => (
                <div key={category} className={gi > 0 ? 'base-category-group case-picker-group-sep' : 'base-category-group'}>
                  <div className="base-picker-group-header">
                    <span>{category}</span>
                    <button
                      type="button"
                      className="case-picker-group-toggle base-picker-group-toggle"
                      onClick={() => toggleBaseGroup(presets)}
                    >
                      {presets.filter(p => p.face).every(p => selectedBases.has(p.face)) ? '取消' : '全选'}
                    </button>
                  </div>
                  <div className="base-picker-grid">
                    {presets.map((b) => {
                      const isSelected = selectedBases.has(b.face);
                      return (
                        <button
                          key={b.name}
                          type="button"
                          className={`base-preset-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleSingleBase(b.face)}
                        >
                          <div className="base-preset-card-check">
                            <input type="checkbox" checked={isSelected} readOnly tabIndex={-1} />
                            <span className="base-preset-name">{b.face || '空'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
                <span className="case-picker-title">已选 {checkedCount} / {caseList.length} 个公式</span>
                <span className="case-picker-alg">{checkedCount > 0 ? '点击选择或取消公式' : '当前分类暂无公式'}</span>
              </button>
            </div>

            <div className="row case-picker-row">
              <label>做底预设</label>
              <button type="button" className="case-picker-trigger" onClick={() => setShowBasePicker(true)}>
                <span className="case-picker-title">
                  {useCustomBase
                    ? `自定义做底: ${customBase.trim() || '（空）'}`
                    : selectedBases.size > 0
                      ? `已选 ${selectedBases.size} 个做底`
                      : '无（白底）'}
                </span>
                <span className="case-picker-alg">点击选择预设做底</span>
              </button>
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

            <div className="row">
              <label>魔方朝向</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                {ORIENTATION_PRESETS.map((o) => (
                  <option key={o.rotation} value={o.rotation}>{o.name}</option>
                ))}
              </select>
            </div>

            <div className="row checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={enableInspection}
                  onChange={(e) => { setEnableInspection(e.target.checked); e.target.blur(); }}
                />
                启用 15s 观察
              </label>
            </div>
            <button className="primary-button" onClick={(e) => { e.target.blur(); gen(); }} disabled={trainingPool.length === 0}>
              生成训练打乱
            </button>
          </section>

          <button type="button" className="secondary-button" onClick={(e) => { e.target.blur(); setShowCubeModal((show) => !show); }}>
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
              <div className="hint">{enableInspection ? '空格键：按住开始观察 / 松开 / 再按住准备 / 松开开跑 / 运行中按空格停止' : '空格键：按空格开始计时 / 再按空格停止'}</div>
            </div>
          )}

          <div className="panel timer">
            {showCubeModal && timerPhase === 'idle' && (
              <div className="cube-panel timer-cube-overlay" role="region" aria-label="六面颜色状态">
                <Cube2DView scramble={orientation ? `${orientation} ${scramble}`.trim() : scramble} />
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
