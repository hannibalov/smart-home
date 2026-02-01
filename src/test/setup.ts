import '@testing-library/jest-dom';
import { vi, Mock } from 'vitest';

// Mock fetch to return a successful Response-like object
global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) })) as unknown as Mock;

// Mock EventSource
global.EventSource = class {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onopen: ((event: Event) => void) | null = null;
    constructor() { }
    close = vi.fn();
} as unknown as typeof EventSource;

// Mock environment variables for tests
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.AUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_key';
process.env.SUPABASE_SECRET_KEY = 'service_role_test_key';
