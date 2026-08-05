import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the One-Look trainer', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /One-Look Trainer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /查看六面颜色状态/i })).toBeInTheDocument();
});
