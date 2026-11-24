import { DEFAULT_SETTINGS, readTrainerState, saveTrainerState, STORAGE_KEY } from './trainerStorage';

beforeEach(() => localStorage.clear());

test('roundtrips more than 50 scores and all persisted settings', () => {
  const records = Array.from({ length: 70 }, (_, i) => ({ id: String(i), time: 1000, timestamp: Date.now() - i, methodGroup: 'EG', method: 'CLL', scramble: 'R U', penalty: i ? 'OK' : 'DNF' }));
  const settings = { ...DEFAULT_SETTINGS, method: 'CLL', caseSelections: { 'EG/CLL': [0, 3], 'LS/LS1': [] }, selectedBases: ['R'], customBase: 'R U', useCustomBase: true, enableInspection: false, orientation: 'y', showCube: true, recordFilter: 'method' };
  expect(saveTrainerState({ records, settings })).toBe(true);
  expect(readTrainerState()).toEqual({ records, settings });
});

test('recovers from corrupt or unavailable storage without throwing', () => {
  localStorage.setItem(STORAGE_KEY, '{broken');
  expect(readTrainerState().records).toEqual([]);
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  expect(readTrainerState(blocked).settings).toEqual(DEFAULT_SETTINGS);
  expect(saveTrainerState({}, blocked)).toBe(false);
});

test('validates stored settings, records and selections', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, settings: { methodGroup: 'bad', method: 'bad', orientation: 'bad', caseSelections: { 'EG/CLL': [0, 0, -1, 999, '1'] } }, records: [null, { time: -1 }] }));
  const state = readTrainerState();
  expect(state.settings.methodGroup).toBe('EG');
  expect(state.settings.method).toBe('EG-1');
  expect(state.settings.orientation).toBe('');
  expect(state.settings.caseSelections['EG/CLL']).toEqual([0]);
  expect(state.records).toEqual([]);
});
