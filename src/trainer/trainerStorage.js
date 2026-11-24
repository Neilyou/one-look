import { CASE_LIBRARY, BASE_PRESETS } from './caseLibrary';
import { ORIENTATION_PRESETS } from './trainingGenerator';

export const STORAGE_KEY = 'one-look.trainer.v1';
export const DEFAULT_SETTINGS = {
  methodGroup: 'EG', method: 'EG-1', caseSelections: {}, selectedBases: [],
  useCustomBase: false, customBase: '', orientation: '', enableInspection: true,
  showCube: false, recordFilter: 'all',
};

function cleanSettings(raw = {}) {
  const methodGroup = Object.hasOwn(CASE_LIBRARY, raw.methodGroup) ? raw.methodGroup : 'EG';
  const method = Object.hasOwn(CASE_LIBRARY[methodGroup], raw.method)
    ? raw.method : methodGroup === 'EG' ? 'EG-1' : Object.keys(CASE_LIBRARY[methodGroup])[0];
  const caseSelections = {};
  Object.entries(CASE_LIBRARY).forEach(([group, methods]) => {
    Object.entries(methods).forEach(([name, cases]) => {
      const key = `${group}/${name}`;
      if (Array.isArray(raw.caseSelections?.[key])) {
        caseSelections[key] = [...new Set(raw.caseSelections[key].filter(i => Number.isInteger(i) && i >= 0 && i < cases.length))];
      }
    });
  });
  return {
    ...DEFAULT_SETTINGS, methodGroup, method, caseSelections,
    selectedBases: Array.isArray(raw.selectedBases)
      ? [...new Set(raw.selectedBases.filter(face => BASE_PRESETS.some(base => base.face === face)))] : [],
    useCustomBase: raw.useCustomBase === true,
    customBase: typeof raw.customBase === 'string' ? raw.customBase : '',
    orientation: ORIENTATION_PRESETS.some(o => o.rotation === raw.orientation) ? raw.orientation : '',
    enableInspection: typeof raw.enableInspection === 'boolean' ? raw.enableInspection : true,
    showCube: raw.showCube === true,
    recordFilter: raw.recordFilter === 'method' ? 'method' : 'all',
  };
}

export function readTrainerState(storage) {
  try {
    storage = storage || window.localStorage;
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || raw.version !== 1) return { settings: { ...DEFAULT_SETTINGS }, records: [] };
    const ids = new Set();
    const records = (Array.isArray(raw.records) ? raw.records : []).filter(record => (
      record && typeof record.id === 'string' && !ids.has(record.id) && ids.add(record.id)
      && Number.isFinite(record.time) && record.time >= 0
      && Number.isFinite(record.timestamp) && record.timestamp > 0
      && typeof record.method === 'string' && typeof record.methodGroup === 'string'
      && typeof record.scramble === 'string'
    )).map(record => ({ ...record, penalty: ['+2', 'DNF'].includes(record.penalty) ? record.penalty : 'OK' }));
    return { settings: cleanSettings(raw.settings || {}), records };
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, records: [] };
  }
}

export function saveTrainerState(state, storage) {
  try {
    storage = storage || window.localStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...state }));
    return true;
  } catch {
    return false;
  }
}
