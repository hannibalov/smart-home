import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { signOut } from 'next-auth/react';
import Home from '@/app/page';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

// Mock the hooks and components
vi.mock('@/hooks/useDeviceDashboard', () => ({
  useDeviceDashboard: () => ({
    devices: [],
    profiles: [],
    selectedDevice: null,
    commandLog: [],
    connectDevice: vi.fn(),
    disconnectDevice: vi.fn(),
    selectDevice: vi.fn(),
    sendCommand: vi.fn(),
    toggleSaveDevice: vi.fn(),
    renameDevice: vi.fn(),
    refreshDevices: vi.fn(),
  }),
}));

vi.mock('@/components/common/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/dashboard/DashboardHeader', () => ({
  default: () => <div data-testid="dashboard-header">DashboardHeader</div>,
}));

vi.mock('@/components/dashboard/DeviceList', () => ({
  default: () => <div data-testid="device-list">DeviceList</div>,
}));

vi.mock('@/components/dashboard/ControlPanel', () => ({
  default: () => <div data-testid="control-panel">ControlPanel</div>,
}));

describe('Home Page / Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render the header', () => {
      render(<Home />);
      expect(screen.getByTestId('header')).toBeDefined();
    });

    test('should render the logout button', () => {
      render(<Home />);
      expect(screen.getByText('Log Out')).toBeDefined();
    });

    test('should render the dashboard header', () => {
      render(<Home />);
      expect(screen.getByTestId('dashboard-header')).toBeDefined();
    });

    test('should render the device list', () => {
      render(<Home />);
      expect(screen.getByTestId('device-list')).toBeDefined();
    });

    test('should render the control panel', () => {
      render(<Home />);
      expect(screen.getByTestId('control-panel')).toBeDefined();
    });
  });

  describe('Logout Functionality', () => {
    test('should render logout button', () => {
      render(<Home />);
      const logoutButton = screen.getByText('Log Out');
      expect(logoutButton).toBeDefined();
    });

    test('should call signOut with login callback on logout button click', async () => {
      render(<Home />);
      const logoutButton = screen.getByText('Log Out');
      
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
      });
    });

    test('should have logout button styled with red color', () => {
      render(<Home />);
      const logoutButton = screen.getByText('Log Out');
      expect(logoutButton.className).toContain('bg-red-600');
      expect(logoutButton.className).toContain('hover:bg-red-700');
    });
  });
});
