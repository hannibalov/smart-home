import '@testing-library/jest-dom';
import { vi, Mock } from 'vitest';

// Mock fetch
global.fetch = vi.fn() as unknown as Mock;

// Mock EventSource
global.EventSource = class {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onopen: ((event: Event) => void) | null = null;
    constructor() { }
    close = vi.fn();
} as unknown as typeof EventSource;
