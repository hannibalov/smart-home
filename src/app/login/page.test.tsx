import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import LoginPage from '@/app/login/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock fetch for session check
global.fetch = vi.fn();

describe('Login Page', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as any);
    // Default: no session (not authenticated)
    (global.fetch as any).mockResolvedValue({
      json: async () => ({ user: null }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Check', () => {
    test('should redirect to home if user is already authenticated', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          user: {
            email: 'user@example.com',
            name: 'Test User',
          },
        }),
      });

      render(<LoginPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    test('should show login form if user is not authenticated', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ user: null }),
      });

      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeDefined();
      });
    });

    test('should show loading state while checking authentication', () => {
      (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<LoginPage />);

      expect(screen.getByText('Loading...')).toBeDefined();
    });

    test('should show login form if session check fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<LoginPage />);

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeDefined();
      });
    });
  });

  describe('Rendering', () => {
    test('should render login form', async () => {
      render(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeDefined();
      });
    });

    test('should render email input field', async () => {
      render(<LoginPage />);
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com');
        expect(emailInput).toBeDefined();
        expect(emailInput.getAttribute('type')).toBe('email');
      });
    });

    test('should render password input field', async () => {
      render(<LoginPage />);
      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('••••••••');
        expect(passwordInput).toBeDefined();
        expect(passwordInput.getAttribute('type')).toBe('password');
      });
    });

    test('should render email/password sign in button', async () => {
      render(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByText('Sign in with Email')).toBeDefined();
      });
    });

    test('should render Google sign in button', async () => {
      render(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByText('Sign in with Google')).toBeDefined();
      });
    });

    test('should render sign up link', async () => {
      render(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByText('Sign up')).toBeDefined();
      });
    });
  });

  describe('Credentials Login', () => {
    test('should call signIn with credentials on form submit', async () => {
      vi.mocked(signIn).mockResolvedValue({ ok: true } as any);

      render(<LoginPage />);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByText('Sign in with Email');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        });
      });
    });

    test('should redirect to home on successful login', async () => {
      vi.mocked(signIn).mockResolvedValue({ ok: true } as any);

      render(<LoginPage />);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByText('Sign in with Email');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    test('should display error message on failed login', async () => {
      vi.mocked(signIn).mockResolvedValue({ error: 'Invalid credentials' } as any);

      render(<LoginPage />);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByText('Sign in with Email');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrong' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeDefined();
      });
    });

    test('should require email field', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
        expect(emailInput.required).toBe(true);
      });
    });

    test('should require password field', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
        expect(passwordInput.required).toBe(true);
      });
    });

    test('should show loading state during login', async () => {
      vi.mocked(signIn).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<LoginPage />);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByText('Sign in with Email') as HTMLButtonElement;

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        expect(screen.getByText('Signing in...')).toBeDefined();
        expect(submitButton.disabled).toBe(true);
      });
    });
  });

  describe('Google Login', () => {
    test('should call signIn with Google provider on button click', async () => {
      vi.mocked(signIn).mockResolvedValue({ ok: true } as any);

      render(<LoginPage />);

      await waitFor(() => {
        const googleButton = screen.getByText('Sign in with Google');
        fireEvent.click(googleButton);
      });

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', { redirect: false });
      });
    });

    test('should redirect to home on successful Google login', async () => {
      vi.mocked(signIn).mockResolvedValue({ ok: true } as any);

      render(<LoginPage />);

      await waitFor(() => {
        const googleButton = screen.getByText('Sign in with Google');
        fireEvent.click(googleButton);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    test('should display error on Google login failure', async () => {
      vi.mocked(signIn).mockResolvedValue({ error: 'Google login failed', ok: false } as any);

      render(<LoginPage />);

      await waitFor(() => {
        const googleButton = screen.getByText('Sign in with Google');
        fireEvent.click(googleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Google login failed. Please try again.')).toBeDefined();
      });
    });
  });

  describe('Form Validation', () => {
    test('should not submit form with empty email', async () => {
      render(<LoginPage />);

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByText('Sign in with Email');

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        // Form should not be submitted due to HTML5 validation
        expect(signIn).not.toHaveBeenCalled();
      });
    });

    test('should not submit form with empty password', async () => {
      render(<LoginPage />);

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const submitButton = screen.getByText('Sign in with Email');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);

        // Form should not be submitted due to HTML5 validation
        expect(signIn).not.toHaveBeenCalled();
      });
    });

    test('should clear error message on new submission attempt', async () => {
      vi.mocked(signIn)
        .mockResolvedValueOnce({ error: 'Invalid credentials' } as any)
        .mockResolvedValueOnce({ ok: true } as any);

      render(<LoginPage />);

      await waitFor(async () => {
        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByText('Sign in with Email');

        // First attempt - fails
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrong' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeDefined();
      });

      // Second attempt - succeeds and error should clear
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Sign in with Email');
      fireEvent.change(passwordInput, { target: { value: 'correct' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).toBeNull();
      });
    });
  });
});
