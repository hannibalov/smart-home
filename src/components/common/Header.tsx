'use client';

import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  mockMode?: boolean;
}

export default function Header({ mockMode = true }: HeaderProps) {
  const [connected] = useState(true);

  // In a real app, this would be managed by an SSE hook or context
  // For now, we'll keep it as a simple state.

  return (
    <header className="glass-panel border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-shadow">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Smart Home</h1>
              <p className="text-xs text-white/50">Controller</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse'
                    : 'bg-rose-400 shadow-lg shadow-rose-400/50'
                }`}
              />
              <span className="text-xs text-white/70">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Mock Mode Badge */}
            {mockMode && (
              <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                <span className="text-xs text-amber-400 font-medium">Mock Mode</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
