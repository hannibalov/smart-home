import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import LabInteractionLog from './LabInteractionLog';

test('LabInteractionLog renders empty state', () => {
  render(<LabInteractionLog logs={[]} readChar="a041" />);
  expect(screen.getByText('No interactions recorded yet')).toBeDefined();
});

test('LabInteractionLog renders log entries', () => {
  const logs = [
    {
      id: 1,
      name: 'Test Command',
      hex: '7e04',
      success: true,
      readValue: 'AA',
      timestamp: '12:00:00',
    },
  ];
  render(<LabInteractionLog logs={logs} readChar="a041" />);
  expect(screen.getByText('Test Command')).toBeDefined();
  expect(screen.getByText('7e04', { exact: false })).toBeDefined();
  expect(screen.getByText('AA', { exact: false })).toBeDefined();
});
