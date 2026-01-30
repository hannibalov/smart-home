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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render login form', () => {
      render(<LoginPage />);
      expect(screen.getByText('Sign in to your account')).toBeDefined();
    });

    test('should render email input field', () => {
      render(<LoginPage />);
      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput).toBeDefined();
      expect(emailInput.getAttribute('type')).toBe('email');
    });

    test('should render password input field', () => {
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toBeDefined();
      expect(passwordInput.getAttribute('type')).toBe('password');
    });

    test('should render email/password sign in button', () => {
      render(<LoginPage />);
      expect(screen.getByText('Sign in with Email')).toBeDefined();
    });

    test('should render Google sign in button', () => {
      render(<LoginPage />);
      expect(screen.getByText('Sign in with Google')).toBeDefined();
    });

    test('should render sign up link', () => {
      render(<LoginPage />);
      expect(screen.getByText('Sign up')).toBeDefined();
    });
  });

  describe('Credentials Login', () => {
    test('should call signIn with credentials on form submit', async () => {
      vi.mocked(signIn).mockResolvedValue({ ok: true } as any);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Sign in with Email');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

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

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Sign in with Email');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    test('should display error message on failed login', async () => {
      vi.mocked(signIn).mockResolvedValue({ error: 'Invalid credentials' } as any);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Sign in with Email');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeDefined();
      });
    });

    test('should require email field', () => {
      render(<LoginPage />);
      const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
      expect(emailInput.required).toBe(true);
    });

    test('should require password field', () => {
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      expect(passwordInput.required).toBe(true);
    });

    test('should show loading state during login', async () => {
      vi.mocked(signIn).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Sign in with Email') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeDefined();
        expect(submitButton.disabled).toBe(true);
      });
    });
  });

  describe('Google Login', () => {
    test('should call signIn with Google provider on button click', async () => {
      vi.mocked(signIn).mockResolvedValue({ ok: true } as any);

      render(<LoginPage />);

      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', { redirectTo: '/' });
      });
    });

    test('should display error on Google login failure', async () => {
      vi.mocked(signIn).mockRejectedValue(new Error('Google login failed'));

      render(<LoginPage />);

      const googleButton = screen.getByText('Sign in with Google');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Google login failed. Please try again.')).toBeDefined();
      });
    });
  });

  describe('Form Validation', () => {
    test('should not submit form with empty email', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Sign in with Email');

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Form should not be submitted due to HTML5 validation
      expect(signIn).not.toHaveBeenCalled();
    });

    test('should not submit form with empty password', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const submitButton = screen.getByText('Sign in with Email');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      // Form should not be submitted due to HTML5 validation
      expect(signIn).not.toHaveBeenCalled();
    });

    test('should clear error message on new submission attempt', async () => {
      vi.mocked(signIn)
        .mockResolvedValueOnce({ error: 'Invalid credentials' } as any)
        .mockResolvedValueOnce({ ok: true } as any);

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByText('Sign in with Email');

      // First attempt - fails
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeDefined();
      });

      // Second attempt - succeeds and error should clear
      fireEvent.change(passwordInput, { target: { value: 'correct' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).toBeNull();
      });
    });
  });
});
