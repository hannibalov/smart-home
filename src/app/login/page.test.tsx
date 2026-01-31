import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase-client'
import LoginPage from '@/app/login/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock Supabase auth
vi.mock('@/lib/supabase-client', () => ({
  supabaseClient: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}))

describe('Login Page', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as any)
    // Default: no session (not authenticated)
    vi.mocked(supabaseClient.auth.getSession).mockResolvedValue({ data: { session: null } } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Check', () => {
    test('should redirect to home if user is already authenticated', async () => {
      vi.mocked(supabaseClient.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user123',
              email: 'user@example.com',
            },
          },
        },
      } as any)

      render(<LoginPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    test('should show login form if user is not authenticated', async () => {
      vi.mocked(supabaseClient.auth.getSession).mockResolvedValue({ data: { session: null } } as any)

      render(<LoginPage />)

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeDefined()
      })
    })

    test('should show loading state while checking authentication', () => {
      vi.mocked(supabaseClient.auth.getSession).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<LoginPage />)

      expect(screen.getByText('Loading...')).toBeDefined()
    })

    test('should show login form if session check fails', async () => {
      vi.mocked(supabaseClient.auth.getSession).mockRejectedValue(new Error('Network error'))

      render(<LoginPage />)

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeDefined()
      })
    })
  })

  describe('Rendering', () => {
    test('should render login form', async () => {
      render(<LoginPage />)
      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeDefined()
      })
    })

    test('should render email input field', async () => {
      render(<LoginPage />)
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        expect(emailInput).toBeDefined()
        expect(emailInput.getAttribute('type')).toBe('email')
      })
    })

    test('should render password input field', async () => {
      render(<LoginPage />)
      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('••••••••')
        expect(passwordInput).toBeDefined()
        expect(passwordInput.getAttribute('type')).toBe('password')
      })
    })

    test('should render email/password sign in button', async () => {
      render(<LoginPage />)
      await waitFor(() => {
        expect(screen.getByText('Sign in with Email')).toBeDefined()
      })
    })

    test('should render Google sign in button', async () => {
      render(<LoginPage />)
      await waitFor(() => {
        expect(screen.getByText('Sign in with Google')).toBeDefined()
      })
    })

    test('should render sign up link', async () => {
      render(<LoginPage />)
      await waitFor(() => {
        expect(screen.getByText('Sign up')).toBeDefined()
      })
    })

    test('should link to /register from sign up link', async () => {
      render(<LoginPage />)
      await waitFor(() => {
        const signUpLink = screen.getByText('Sign up').closest('a')
        expect(signUpLink?.getAttribute('href')).toBe('/register')
      })
    })
  })

  describe('Credentials Login', () => {
    test('should call signInWithPassword on form submit', async () => {
      vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
        data: { session: { user: { id: 'user123', email: 'test@example.com' } } },
        error: null,
      } as any)

      render(<LoginPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Sign in with Email')

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    test('should redirect to home on successful login', async () => {
      vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
        data: { session: { user: { id: 'user123', email: 'test@example.com' } } },
        error: null,
      } as any)

      render(<LoginPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Sign in with Email')

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    test('should display error message on failed login', async () => {
      vi.mocked(supabaseClient.auth.signInWithPassword).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      } as any)

      render(<LoginPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Sign in with Email')

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'wrong' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Invalid login credentials')).toBeDefined()
      })
    })

    test('should require email field', async () => {
      render(<LoginPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement
        expect(emailInput.required).toBe(true)
      })
    })

    test('should require password field', async () => {
      render(<LoginPage />)

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
        expect(passwordInput.required).toBe(true)
      })
    })

    test('should show loading state during login', async () => {
      vi.mocked(supabaseClient.auth.signInWithPassword).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<LoginPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Sign in with Email') as HTMLButtonElement

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)

        expect(screen.getByText('Signing in...')).toBeDefined()
        expect(submitButton.disabled).toBe(true)
      })
    })
  })

  describe('Google Login', () => {
    test('should call signInWithOAuth with google provider on button click', async () => {
      vi.mocked(supabaseClient.auth.signInWithOAuth).mockResolvedValue({ data: { url: 'https://auth.supabase.co' }, error: null } as any)

      render(<LoginPage />)

      await waitFor(() => {
        const googleButton = screen.getByText('Sign in with Google')
        fireEvent.click(googleButton)
      })

      await waitFor(() => {
        expect(supabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback'),
          },
        })
      })
    })

    test('should display error on Google login failure', async () => {
      vi.mocked(supabaseClient.auth.signInWithOAuth).mockResolvedValue({
        data: { url: null },
        error: { message: 'OAuth error' },
      } as any)

      render(<LoginPage />)

      await waitFor(() => {
        const googleButton = screen.getByText('Sign in with Google')
        fireEvent.click(googleButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Google login failed. Please try again.')).toBeDefined()
      })
    })
  })

  describe('Form Validation', () => {
    test('should not submit form with empty email', async () => {
      render(<LoginPage />)

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Sign in with Email')

        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)

        // Form should not be submitted due to HTML5 validation
        expect(supabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
      })
    })

    test('should not submit form with empty password', async () => {
      render(<LoginPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const submitButton = screen.getByText('Sign in with Email')

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.click(submitButton)

        // Form should not be submitted due to HTML5 validation
        expect(supabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
      })
    })

    test('should clear error message on new submission attempt', async () => {
      vi.mocked(supabaseClient.auth.signInWithPassword)
        .mockResolvedValueOnce({
          data: { session: null },
          error: { message: 'Invalid credentials' },
        } as any)
        .mockResolvedValueOnce({
          data: { session: { user: { id: 'user123', email: 'test@example.com' } } },
          error: null,
        } as any)

      render(<LoginPage />)

      await waitFor(async () => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Sign in with Email')

        // First attempt - fails
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'wrong' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeDefined()
      })

      // Second attempt - succeeds and error should clear
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByText('Sign in with Email')
      fireEvent.change(passwordInput, { target: { value: 'correct' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).toBeNull()
      })
    })
  })
})

