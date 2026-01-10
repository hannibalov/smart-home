'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DeviceDetails, LightState, CommandLogEntry, DeviceProfile } from '@/types';
import ColorPicker from '../common/ColorPicker';
import { encodeILinkCommand } from '@/services/ble/encoding';

interface LightControlProps {
  device: DeviceDetails;
  profiles: DeviceProfile[];
  onCommand: (type: string, value: unknown) => Promise<boolean>;
  commandLog: CommandLogEntry[];
  onProfileChange: () => void;
}

export default function LightControl({ device, profiles, onCommand, commandLog, onProfileChange }: LightControlProps) {
  const [state, setState] = useState<LightState>({
    power: false,
    brightness: 100,
    colorTemperature: 50,
  });
  const [sending, setSending] = useState(false);
  const [rawHex, setRawHex] = useState('');
  const [selectedCharacteristic, setSelectedCharacteristic] = useState('0xFFE1');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Sync state from device prop
  useEffect(() => {
    if (device.state) {
      setState(device.state);
    }
  }, [device.id, device.state]);

  const handleCommand = async (type: string, value: unknown) => {
    setSending(true);
    try {
      const profile = profiles.find(p => p.id === device.profileId) || 
                     (device.services?.includes('a032') ? profiles.find(p => p.id === 'ilink') : null);
      
      if (profile && profile.id === 'ilink') {
        let hexCommand = '';
        const targetChar = device.targetChar || profile.targetChar || 'a040';
        
        if (type === 'power') {
          hexCommand = encodeILinkCommand('0805', value ? '01' : '00');
        } else if (type === 'color') {
          const { r, g, b } = value as { r: number; g: number; b: number };
          const colorHex = r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
          hexCommand = encodeILinkCommand('0802', colorHex);
        } else if (type === 'brightness') {
          const brightness = Math.min(100, Math.max(0, value as number));
          const brightnessHex = Math.floor((brightness / 100) * 255).toString(16).padStart(2, '0');
          hexCommand = encodeILinkCommand('0801', brightnessHex);
        }
        
        if (hexCommand) {
          const res = await fetch(`/api/devices/${device.id}/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              raw: hexCommand,
              characteristic: targetChar,
            }),
          });
          await res.json();
        }
      } else {
        await onCommand(type, value);
      }
      
      if (type === 'power') {
        setState((prev) => ({ ...prev, power: value as boolean }));
      } else if (type === 'brightness') {
        setState((prev) => ({ ...prev, brightness: value as number }));
      } else if (type === 'colorTemperature') {
        setState((prev) => ({ ...prev, colorTemperature: value as number }));
      }
    } finally {
      setSending(false);
    }
  };

  const handleProfileChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfileLoading(true);
    try {
      await fetch(`/api/devices/${device.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: e.target.value }),
      });
      onProfileChange();
    } finally {
      setProfileLoading(false);
    }
  };

  const handleColorChange = (color: { r: number; g: number; b: number }) => {
    handleCommand('color', color);
  };

  const handleRawSend = async () => {
    if (!rawHex.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/devices/${device.id}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw: rawHex.replace(/\s/g, ''),
          characteristic: selectedCharacteristic,
        }),
      });
      setRawHex('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Light Control</h2>
        <div className="flex items-center gap-3">
          <Link
            href={`/devices/${device.id}/lab`}
            className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
            title="Advanced Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
        </div>
      </div>

      {/* Profile & Settings Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <select 
            title="Protocol Profile"
            onChange={handleProfileChange}
            value={device.profileId || ''}
            disabled={profileLoading || sending}
            className="flex-1 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white/70 outline-none hover:bg-white/10 transition-colors cursor-pointer"
        >
            <option value="">Select Profile...</option>
            {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
      </div>

      {/* Color Picker */}
      <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10">
        <ColorPicker 
          onChange={handleColorChange}
          disabled={!state.power || sending}
        />
      </div>

      {/* Power Toggle */}
      <div className="mb-8">
        <div className="flex gap-4">
            <button
            onClick={() => handleCommand('power', !state.power)}
            disabled={sending}
            className={`flex-1 py-6 rounded-2xl text-xl font-bold transition-all duration-300 ${
                state.power
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
            } disabled:opacity-50`}
            >
            <div className="flex items-center justify-center gap-3">
                <svg
                className={`w-8 h-8 transition-all ${state.power ? 'text-white' : 'text-white/40'}`}
                fill={state.power ? 'currentColor' : 'none'}
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
                {state.power ? 'ON' : 'OFF'}
            </div>
            </button>
            
            <button
                onClick={async () => {
                    setSending(true);
                    try {
                        const res = await fetch(`/api/devices/${device.id}/state`);
                        const newState = await res.json();
                        if (newState && Object.keys(newState).length > 0) {
                            setState(prev => ({ ...prev, ...newState }));
                        }
                    } catch (e) {
                        console.error('Failed to refresh state:', e);
                    } finally {
                        setSending(false);
                    }
                }}
                disabled={sending}
                className="w-20 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1"
                title="Refresh State"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-medium">Sync</span>
            </button>
        </div>
      </div>

      {/* Brightness Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-white/70">Brightness</label>
          <span className="text-sm font-mono text-cyan-400">{state.brightness}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={state.brightness}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setState((prev) => ({ ...prev, brightness: value }));
          }}
          onMouseUp={() => handleCommand('brightness', state.brightness)}
          onTouchEnd={() => handleCommand('brightness', state.brightness)}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb"
          disabled={!state.power || sending}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/30">0%</span>
          <span className="text-xs text-white/30">100%</span>
        </div>
      </div>

      {/* Color Temperature */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-white/70">Color Temperature</label>
          <span className="text-sm font-mono text-cyan-400">
            {state.colorTemperature < 50 ? 'Warm' : state.colorTemperature > 50 ? 'Cool' : 'Neutral'}
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-0 h-2 rounded-full bg-gradient-to-r from-amber-400 via-white to-cyan-400 opacity-30" />
          <input
            type="range"
            min="0"
            max="100"
            value={state.colorTemperature}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setState((prev) => ({ ...prev, colorTemperature: value }));
            }}
            onMouseUp={() => handleCommand('colorTemperature', state.colorTemperature)}
            onTouchEnd={() => handleCommand('colorTemperature', state.colorTemperature)}
            className="relative w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer slider-thumb"
            disabled={!state.power || sending}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-amber-400">Warm</span>
          <span className="text-xs text-cyan-400">Cool</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mb-8">
        <label className="text-sm font-medium text-white/70 mb-3 block">Quick Presets</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'Dim', brightness: 20, temp: 20 },
            { name: 'Reading', brightness: 80, temp: 70 },
            { name: 'Relax', brightness: 50, temp: 30 },
            { name: 'Bright', brightness: 100, temp: 50 },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                handleCommand('brightness', preset.brightness);
                handleCommand('colorTemperature', preset.temp);
                setState((prev) => ({
                  ...prev,
                  brightness: preset.brightness,
                  colorTemperature: preset.temp,
                }));
              }}
              disabled={!state.power || sending}
              className="py-2 px-3 rounded-lg text-sm font-medium bg-white/5 text-white/70 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced: Raw Hex Commands */}
      <div className="border-t border-white/10 pt-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors mb-4"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Advanced: Raw Hex Commands
        </button>

        {showAdvanced && (
          <div className="space-y-4">
            {/* Characteristic selector */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">Characteristic UUID</label>
              <select
                value={selectedCharacteristic}
                onChange={(e) => setSelectedCharacteristic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-mono focus:outline-none focus:border-cyan-500/50"
              >
                {device.characteristics.map((char) => (
                  <option key={char.uuid} value={char.uuid}>
                    {char.uuid} ({char.properties.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Hex input */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">Hex Command</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rawHex}
                  onChange={(e) => setRawHex(e.target.value)}
                  placeholder="e.g. 01FF00"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={handleRawSend}
                  disabled={!rawHex.trim() || sending}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all disabled:opacity-50 font-medium text-sm"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Command Log */}
            {commandLog.length > 0 && (
              <div>
                <label className="text-xs text-white/50 mb-2 block">Command History</label>
                <div className="max-h-40 overflow-y-auto rounded-lg bg-black/30 border border-white/5">
                  {commandLog.slice(-10).reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="px-3 py-2 border-b border-white/5 last:border-0 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                          className={
                            entry.success ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {entry.success ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="text-cyan-400 mt-1">{entry.command}</div>
                      {entry.response && (
                        <div className="text-white/30 mt-0.5">{entry.response}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
