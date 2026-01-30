import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import DashboardHeader from './DashboardHeader';

test('DashboardHeader renders device count', () => {
  render(<DashboardHeader deviceCount={5} scanning={false} onScan={() => {}} />);
  expect(screen.getByText('5 devices found')).toBeDefined();
});

test('DashboardHeader shows scanning state', () => {
  render(<DashboardHeader deviceCount={0} scanning={true} onScan={() => {}} />);
  expect(screen.getByText('Scanning...', { selector: 'p' })).toBeDefined();
  expect(screen.getByRole('button')).toBeDisabled();
});

test('DashboardHeader calls onScan when clicked', () => {
  const onScan = vi.fn();
  render(<DashboardHeader deviceCount={0} scanning={false} onScan={onScan} />);
  fireEvent.click(screen.getByText('Scan for Devices'));
  expect(onScan).toHaveBeenCalled();
});
