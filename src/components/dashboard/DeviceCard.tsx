'use client';

import { useState } from 'react';
import type { DeviceDetails, DeviceProfile, LightState } from '@/types';

interface DeviceCardProps {
  device: DeviceDetails;
  profiles: DeviceProfile[];
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onSelect: (id: string) => void;
  onProfileChange: () => void;
  onToggleSave: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function DeviceCard({
  device,
  profiles,
  onConnect,
  onDisconnect,
  onSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onProfileChange: _onProfileChange,
  onToggleSave,
  onRename,
}: DeviceCardProps) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<Partial<LightState>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(device.name);

  const handleConnectionToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (device.connected) {
        await onDisconnect(device.id);
      } else {
        await onConnect(device.id);
        // Fetch state after connection
        fetchState();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRename = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (tempName.trim()) {
      onRename(device.id, tempName.trim());
      setIsEditing(false);
    }
  };

  const fetchState = async () => {
    if (!device.connected) return;
    try {
      const res = await fetch(`/api/devices/${device.id}/state`);
      const data = await res.json();
      setState(data);
    } catch (e) {
      console.error('Failed to fetch state:', e);
    }
  };


  // Convert RSSI to signal strength (1-4 bars)
  const getSignalStrength = (rssi: number): number => {
    if (rssi >= -50) return 4;
    if (rssi >= -60) return 3;
    if (rssi >= -70) return 2;
    return 1;
  };

  const signalStrength = getSignalStrength(device.rssi);

  // Update tempName when device.name changes externally (e.g. initial load)
  // but only if not editing
  if (!isEditing && tempName !== device.name && !(device.name === 'Unknown Device' || device.name === 'ilink? (Service A032)')) {
     setTempName(device.name);
  }

  return (
    <div
      onClick={() => device.connected && !isEditing && onSelect(device.id)}
      className={`relative glass-panel p-5 rounded-2xl border transition-all duration-300 ${
        device.connected
          ? 'border-cyan-500/30 shadow-lg shadow-cyan-500/10 cursor-pointer hover:border-cyan-400/50 hover:shadow-cyan-500/20'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between mb-4 pr-8">
          {/* Save Action for Unsaved Devices */}
          {!device.saved && (
              <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (device.connected) onToggleSave(device.id);
                }}
                disabled={!device.connected}
                className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 z-10 flex items-center gap-1 ${
                    device.connected 
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                }`}
              >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Save
              </button>
          )}
        <div className="flex items-center gap-3">
          {/* Device Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
              device.connected
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25'
                : 'bg-white/5 border border-white/10'
            }`}
          >
            <svg
              className={`w-6 h-6 ${device.connected ? 'text-white' : 'text-white/50'}`}
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
            {isEditing ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-sm text-white w-32 focus:outline-none focus:border-cyan-500"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(e);
                            if (e.key === 'Escape') {
                                setIsEditing(false);
                                setTempName(device.name);
                            }
                        }}
                    />
                    <button onClick={handleRename} className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); setTempName(device.name); }} className="p-1 text-rose-400 hover:bg-rose-500/10 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 group">
                    <h3 className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]" title={device.name}>{device.name}</h3>
                    {device.connected && (
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setTempName(device.name); 
                                setIsEditing(true); 
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white p-1"
                            title="Rename device"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2">
                <p className="text-xs text-white/40 font-mono">{device.id}</p>
                {state.brightness !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {state.brightness}% Brightness
                    </span>
                )}
            </div>
          </div>
        </div>

        {/* Signal Strength */}
        <div className="flex flex-col items-end gap-2 mt-1">
            <div className="flex items-end gap-0.5 h-3">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`w-0.5 rounded-full transition-all ${
                    bar <= signalStrength
                      ? 'bg-emerald-400'
                      : 'bg-white/20'
                  }`}
                  style={{ height: `${bar * 25}%` }}
                />
              ))}
            </div>
            {device.profileId && (
                <span className="text-[10px] font-mono text-cyan-400/70 border border-cyan-500/20 px-1 rounded bg-cyan-500/5">
                    {profiles.find(p => p.id === device.profileId)?.name || device.profileId.toUpperCase()}
                </span>
            )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center gap-3">
            {device.connected && (
                <button 
                    title="Refresh State"
                    onClick={(e) => { e.stopPropagation(); fetchState(); }}
                    className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-[10px]">Refresh</span>
                </button>
            )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConnectionToggle}
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              device.connected
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {device.connected ? 'Disconnecting...' : 'Connecting...'}
              </span>
            ) : device.connected ? (
              'Disconnect'
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </div>

      {/* Services */}
      {device.services && device.services.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-white/40 mb-2">Services</p>
          <div className="flex flex-wrap gap-1">
            {device.services.map((service) => (
              <span
                key={service}
                className="px-2 py-0.5 rounded text-xs font-mono bg-white/5 text-white/50"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
