import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase-client'
import RegisterPage from '@/app/register/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock Supabase auth
vi.mock('@/lib/supabase-client', () => ({
  supabaseClient: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
    },
  },
}))

describe('Register Page', () => {
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

      render(<RegisterPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    test('should show registration form if user is not authenticated', async () => {
      vi.mocked(supabaseClient.auth.getSession).mockResolvedValue({ data: { session: null } } as any)

      render(<RegisterPage />)

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeDefined()
      })
    })

    test('should show loading state while checking authentication', () => {
      vi.mocked(supabaseClient.auth.getSession).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<RegisterPage />)

      expect(screen.getByText('Loading...')).toBeDefined()
    })
  })

  describe('Rendering', () => {
    test('should render registration form', async () => {
      render(<RegisterPage />)
      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeDefined()
      })
    })

    test('should render email input field', async () => {
      render(<RegisterPage />)
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        expect(emailInput).toBeDefined()
        expect(emailInput.getAttribute('type')).toBe('email')
      })
    })

    test('should render name input field', async () => {
      render(<RegisterPage />)
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Your name')
        expect(nameInput).toBeDefined()
        expect(nameInput.getAttribute('type')).toBe('text')
      })
    })

    test('should render password input field', async () => {
      render(<RegisterPage />)
      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('••••••••')
        expect(passwordInput).toBeDefined()
        expect(passwordInput.getAttribute('type')).toBe('password')
      })
    })

    test('should render sign up button', async () => {
      render(<RegisterPage />)
      await waitFor(() => {
        expect(screen.getByText('Create account')).toBeDefined()
      })
    })

    test('should render sign in link', async () => {
      render(<RegisterPage />)
      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeDefined()
      })
    })
  })

  describe('User Registration', () => {
    test('should call signUp with email and password', async () => {
      vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
        data: { user: { id: 'user123', email: 'new@example.com' } },
        error: null,
      } as any)

      render(<RegisterPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const nameInput = screen.getByPlaceholderText('Your name')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Create account')

        fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
        fireEvent.change(nameInput, { target: { value: 'New User' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(supabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
          options: {
            data: {
              name: 'New User',
            },
          },
        })
      })
    })

    test('should redirect to login after successful registration', async () => {
      vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
        data: { user: { id: 'user123', email: 'new@example.com' } },
        error: null,
      } as any)

      render(<RegisterPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const nameInput = screen.getByPlaceholderText('Your name')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Create account')

        fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
        fireEvent.change(nameInput, { target: { value: 'New User' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?message=Check your email to confirm your account')
      })
    })

    test('should display error message on failed registration', async () => {
      vi.mocked(supabaseClient.auth.signUp).mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      } as any)

      render(<RegisterPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const nameInput = screen.getByPlaceholderText('Your name')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Create account')

        fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
        fireEvent.change(nameInput, { target: { value: 'Existing User' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('User already registered')).toBeDefined()
      })
    })

    test('should require email field', async () => {
      render(<RegisterPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement
        expect(emailInput.required).toBe(true)
      })
    })

    test('should require name field', async () => {
      render(<RegisterPage />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Your name') as HTMLInputElement
        expect(nameInput.required).toBe(true)
      })
    })

    test('should require password field', async () => {
      render(<RegisterPage />)

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
        expect(passwordInput.required).toBe(true)
      })
    })

    test('should show loading state during registration', async () => {
      vi.mocked(supabaseClient.auth.signUp).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<RegisterPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const nameInput = screen.getByPlaceholderText('Your name')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Create account') as HTMLButtonElement

        fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
        fireEvent.change(nameInput, { target: { value: 'New User' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)

        expect(screen.getByText('Creating account...')).toBeDefined()
        expect(submitButton.disabled).toBe(true)
      })
    })
  })

  describe('Form Validation', () => {
    test('should not submit form with empty email', async () => {
      render(<RegisterPage />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Your name')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Create account')

        fireEvent.change(nameInput, { target: { value: 'New User' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)

        // Form should not be submitted due to HTML5 validation
        expect(supabaseClient.auth.signUp).not.toHaveBeenCalled()
      })
    })

    test('should not submit form with empty name', async () => {
      render(<RegisterPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Create account')

        fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)

        // Form should not be submitted due to HTML5 validation
        expect(supabaseClient.auth.signUp).not.toHaveBeenCalled()
      })
    })

    test('should not submit form with empty password', async () => {
      render(<RegisterPage />)

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const nameInput = screen.getByPlaceholderText('Your name')
        const submitButton = screen.getByText('Create account')

        fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
        fireEvent.change(nameInput, { target: { value: 'New User' } })
        fireEvent.click(submitButton)

        // Form should not be submitted due to HTML5 validation
        expect(supabaseClient.auth.signUp).not.toHaveBeenCalled()
      })
    })

    test('should clear error message on new submission attempt', async () => {
      vi.mocked(supabaseClient.auth.signUp)
        .mockResolvedValueOnce({
          data: { user: null },
          error: { message: 'Error registering' },
        } as any)
        .mockResolvedValueOnce({
          data: { user: { id: 'user123', email: 'new@example.com' } },
          error: null,
        } as any)

      render(<RegisterPage />)

      await waitFor(async () => {
        const emailInput = screen.getByPlaceholderText('you@example.com')
        const nameInput = screen.getByPlaceholderText('Your name')
        const passwordInput = screen.getByPlaceholderText('••••••••')
        const submitButton = screen.getByText('Create account')

        // First attempt - fails
        fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
        fireEvent.change(nameInput, { target: { value: 'New User' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Error registering')).toBeDefined()
      })

      // Second attempt - succeeds and error should clear
      const passwordInput = screen.getByPlaceholderText('••••••••')
      const submitButton = screen.getByText('Create account')
      fireEvent.change(passwordInput, { target: { value: 'newpassword456' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText('Error registering')).toBeNull()
      })
    })
  })

  describe('Navigation', () => {
    test('should have link to sign in page', async () => {
      render(<RegisterPage />)

      await waitFor(() => {
        const signInLink = screen.getByText('Sign in') as HTMLAnchorElement
        expect(signInLink).toBeDefined()
        expect(signInLink.getAttribute('href')).toBe('/login')
      })
    })
  })
})
