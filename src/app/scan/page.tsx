'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import { useDeviceDashboard } from '@/hooks/useDeviceDashboard';
// Import presets from JSON directly for now
import presetsData from '@/data/devicePresets.json';
import DeviceList from '@/components/dashboard/DeviceList';

type Step = 'category' | 'connection' | 'preset' | 'scanning' | 'results' | 'connecting';

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const {
      devices,
      profiles,
      scanning,
      connectDevice,
      disconnectDevice,
      selectDevice,
      toggleSaveDevice,
      renameDevice,
      refreshDevices,
      startScan
  } = useDeviceDashboard();

  const { categories, connectionTypes, presets } = presetsData;

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('connection');
  };

  const handleConnectionSelect = (connectionId: string) => {
    setSelectedConnection(connectionId);
    setStep('preset');
  };

  const handlePresetSelect = async (presetId: string) => {
    setSelectedPreset(presetId);
    
    const preset = presets.find(p => p.id === presetId);
    
    if (preset?.connections.includes('bluetooth')) {
        setStep('scanning');
        try {
            await startScan(); // Start 5s scan
            // Transition to results after scan duration
            setTimeout(() => {
                setStep('results');
            }, 5500);
        } catch (error) {
            console.error('Failed to start scan', error);
            setStep('preset');
        }
    } else {
        // Mock flow for non-BLE
        setStep('connecting');
        setTimeout(() => {
            router.push('/');
        }, 2000);
    }
  };

  const filteredPresets = presets.filter(p => 
    p.category === selectedCategory && 
    p.connections.includes(selectedConnection!)
  );

  const discoveredDevices = devices.filter(d => !d.saved);

  const renderStep = () => {
    switch (step) {
      case 'category':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl hover:bg-white/5 transition-all border border-white/5 hover:border-cyan-500/30 group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
                  {/* Simple generic icon mapping based on id */}
                  {cat.id === 'lights' && (
                    <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  )}
                  {cat.id === 'climate' && (
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                  )}
                  {cat.id === 'appliances' && (
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  )}
                  {cat.id === 'security' && (
                    <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  )}
                </div>
                <h3 className="text-lg font-medium text-white mb-1">{cat.name}</h3>
                <p className="text-xs text-white/40">{cat.description}</p>
              </button>
            ))}
          </div>
        );

      case 'connection':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {connectionTypes.map((conn) => (
              <button
                key={conn.id}
                onClick={() => handleConnectionSelect(conn.id)}
                className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl hover:bg-white/5 transition-all border border-white/5 hover:border-cyan-500/30 group"
              >
                 <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-all">
                    {conn.id === 'bluetooth' && <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12.5 7.5L5 15l7.5 7.5m0-15L20 15l-7.5 7.5m0-15v15" /></svg>}
                    {conn.id === 'wifi' && <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>}
                    {conn.id === 'rf' && <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>}
                 </div>
                <h3 className="text-lg font-medium text-white mb-1">{conn.name}</h3>
                <p className="text-xs text-white/40">{conn.description}</p>
              </button>
            ))}
          </div>
        );

      case 'preset':
        return (
          <div className="space-y-4">
            {filteredPresets.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                    No presets found for this combination.
                </div>
            ) : (
                filteredPresets.map((preset) => (
                <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className="w-full flex items-center gap-4 p-4 glass-panel rounded-xl hover:bg-white/5 transition-all text-left border border-white/5 hover:border-cyan-500/30"
                >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white/20">
                    {preset.name.charAt(0)}
                    </div>
                    <div>
                    <h3 className="font-medium text-white">{preset.name}</h3>
                    <p className="text-xs text-white/40">{preset.description}</p>
                    </div>
                    <div className="ml-auto">
                        <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                </button>
                ))
            )}
          </div>
        );

      case 'results':
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Discovered Devices</h2>
                    {scanning && (
                        <div className="flex items-center gap-2 text-cyan-400 text-sm">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Still scanning...
                        </div>
                    )}
                </div>
                
                <DeviceList
                    title=""
                    devices={discoveredDevices}
                    profiles={profiles}
                    onConnect={connectDevice}
                    onDisconnect={disconnectDevice}
                    onSelect={selectDevice}
                    onProfileChange={refreshDevices}
                    onToggleSave={toggleSaveDevice}
                    onRename={renameDevice}
                    emptyMessage={scanning ? "Scanning for devices..." : "No new devices found. Try moving closer or resetting the device."}
                />

                <div className="flex justify-between items-center pt-8 border-t border-white/5">
                    <button 
                        onClick={() => setStep('preset')}
                        className="text-white/50 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all text-sm"
                    >
                        Scan Again
                    </button>
                    <button 
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                    >
                        Finish & Go to Dashboard
                    </button>
                </div>
            </div>
        );

      case 'scanning':
      case 'connecting':
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-cyan-500/30 animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                         {step === 'scanning' ? (
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                         ) : (
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         )}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                    {step === 'scanning' ? 'Scanning for Devices...' : 'Connecting...'}
                </h3>
                <p className="text-white/40 text-center max-w-xs">
                    {step === 'scanning' ? 'Looking for compatible Bluetooth devices nearby. This will take a few seconds.' : 'Establishing connection to the selected device.'}
                </p>
                {step === 'scanning' && (
                    <button 
                        onClick={() => setStep('results')}
                        className="mt-8 text-cyan-400/60 hover:text-cyan-400 text-sm font-medium transition-all"
                    >
                        Skip to Results
                    </button>
                )}
            </div>
        );
    }
  };

  const getBreadcrumbs = () => {
      const items = [{ id: 'category', label: 'Device Type' }];
      if (step !== 'category') items.push({ id: 'connection', label: 'Connection' });
      if (step === 'preset' || step === 'scanning' || step === 'results') items.push({ id: 'preset', label: 'Discovery' });
      
      return (
          <div className="flex items-center gap-2 mb-8 text-sm">
              <button onClick={() => router.push('/')} className="text-white/40 hover:text-white">Home</button>
              <span className="text-white/20">/</span>
              {items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                      <span className={`${index === items.length - 1 ? 'text-cyan-400' : 'text-white/40'}`}>
                          {item.label}
                      </span>
                      {index < items.length - 1 && <span className="text-white/20">/</span>}
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="min-h-screen">
      <Header mockMode={false} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {getBreadcrumbs()}

        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Add New Device</h1>
            <p className="text-white/50">Follow the steps to configure and connect your new smart device.</p>
        </div>

        {renderStep()}
        
        {step !== 'category' && step !== 'scanning' && step !== 'connecting' && step !== 'results' && (
            <div className="mt-8 pt-8 border-t border-white/5 flex">
                <button 
                    onClick={() => {
                        if (step === 'connection') setStep('category');
                        if (step === 'preset') setStep('connection');
                    }}
                    className="text-white/50 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
            </div>
        )}
      </main>
    </div>
  );
}
