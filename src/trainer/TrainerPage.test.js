import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import TrainerPage from './TrainerPage';
import { DEFAULT_SETTINGS, STORAGE_KEY } from './trainerStorage';

beforeEach(() => { localStorage.clear(); jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

const stopAfter = ms => {
  fireEvent.keyDown(window, { code: 'Space' });
  fireEvent.keyUp(window, { code: 'Space' });
  act(() => jest.advanceTimersByTime(ms));
  fireEvent.keyDown(window, { code: 'Space' });
  fireEvent.keyUp(window, { code: 'Space' });
};

test('records a timed solve, corrects penalty, and restores scores/settings after reopening', () => {
  const view = render(<TrainerPage />);
  fireEvent.click(screen.getByLabelText('启用 15s 观察'));
  fireEvent.change(screen.getByLabelText('子类'), { target: { value: 'CLL' } });
  fireEvent.change(screen.getByLabelText('魔方朝向'), { target: { value: 'y' } });
  fireEvent.click(screen.getByText(/已选 .* 个公式/));
  fireEvent.click(screen.getByRole('button', { name: '取消全选', exact: true }));
  fireEvent.click(screen.getAllByRole('button').find(button => button.classList.contains('case-picker-group-card')));
  fireEvent.click(screen.getByRole('button', { name: '×', exact: true }));
  stopAfter(3210);
  expect(within(screen.getByRole('table', { name: '最近成绩' })).getByText('3.21')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /查看第 1 次成绩/ }));
  fireEvent.click(screen.getByRole('button', { name: '+2', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: '关闭' }));
  expect(screen.getByRole('button', { name: /5.21/ })).toBeInTheDocument();
  view.unmount();
  render(<TrainerPage />);
  expect(screen.getByLabelText('子类')).toHaveValue('CLL');
  expect(screen.getByLabelText('魔方朝向')).toHaveValue('y');
  expect(screen.getByLabelText('启用 15s 观察')).not.toBeChecked();
  expect(screen.getByText('已选 1 / 40 个公式')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /5.21/ })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).records[0].penalty).toBe('+2');
});

test('clear by method requires confirmation and keeps other scores and settings', () => {
  const record = { time: 3000, penalty: 'OK', timestamp: Date.now(), scramble: 'R', methodGroup: 'EG' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, settings: { ...DEFAULT_SETTINGS, recordFilter: 'method' }, records: [{ ...record, id: 'a', method: 'EG-1' }, { ...record, id: 'b', method: 'CLL' }] }));
  render(<TrainerPage />);
  fireEvent.click(screen.getByRole('button', { name: '清空当前成绩' }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).records).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: '确认清空' }));
  expect(screen.getByText('暂无成绩')).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  expect(saved.records.map(record => record.id)).toEqual(['b']);
  expect(saved.settings.method).toBe('EG-1');
});

test('restores an intentionally empty formula selection instead of selecting everything', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, settings: { ...DEFAULT_SETTINGS, caseSelections: { 'EG/EG-1': [] } }, records: [] }));
  render(<TrainerPage />);
  expect(screen.getByRole('button', { name: '生成训练打乱' })).toBeDisabled();
  expect(screen.getByText('已选 0 / 40 个公式')).toBeInTheDocument();
});

test('inspection still starts, readies and records a solve', () => {
  render(<TrainerPage />);
  fireEvent.keyDown(window, { code: 'Space' });
  fireEvent.keyUp(window, { code: 'Space' });
  act(() => jest.advanceTimersByTime(2000));
  expect(document.querySelector('.time')).toHaveTextContent('13');
  fireEvent.keyDown(window, { code: 'Space' });
  act(() => jest.advanceTimersByTime(150));
  fireEvent.keyUp(window, { code: 'Space' });
  act(() => jest.advanceTimersByTime(2340));
  fireEvent.keyDown(window, { code: 'Space' });
  fireEvent.keyUp(window, { code: 'Space' });
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).records[0].time).toBe(2340);
});

test('custom base and cube visibility settings survive unmount', () => {
  const view = render(<TrainerPage />);
  fireEvent.click(screen.getByLabelText('使用自定义做底'));
  fireEvent.change(screen.getByLabelText('自定义做底', { exact: true }), { target: { value: "R U R'" } });
  fireEvent.click(screen.getByRole('button', { name: '查看六面颜色状态' }));
  fireEvent.change(screen.getByLabelText('方法组', { exact: true }), { target: { value: 'LS' } });
  fireEvent.change(screen.getByLabelText('子类', { exact: true }), { target: { value: 'LS3' } });
  view.unmount();
  render(<TrainerPage />);
  expect(screen.getByLabelText('方法组', { exact: true })).toHaveValue('LS');
  expect(screen.getByLabelText('子类', { exact: true })).toHaveValue('LS3');
  expect(screen.getByLabelText('使用自定义做底')).toBeChecked();
  expect(screen.getByLabelText('自定义做底', { exact: true })).toHaveValue("R U R'");
  expect(screen.getByRole('region', { name: '六面颜色状态' })).toBeInTheDocument();
});

test('reports save failure instead of silently promising persistence', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota'); });
  render(<TrainerPage />);
  expect(screen.getByRole('alert')).toHaveTextContent('无法保存本地数据');
  spy.mockRestore();
});
