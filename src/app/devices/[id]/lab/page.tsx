'use client';

import { use } from 'react';
import Header from '@/components/common/Header';
import Link from 'next/link';
import LabConfig from '@/components/lab/LabConfig';
import LabCustomCommand from '@/components/lab/LabCustomCommand';
import LabByteSweep from '@/components/lab/LabByteSweep';
import LabPatternsSweep from '@/components/lab/LabPatternsSweep';
import LabInteractionLog from '@/components/lab/LabInteractionLog';
import { useDeviceLab } from '@/hooks/useDeviceLab';

interface LabPageProps {
  params: Promise<{ id: string }>;
}

export default function DeviceLab({ params }: LabPageProps) {
  const { id: deviceId } = use(params);
  const {
    device,
    loading,
    customHex,
    setCustomHex,
    targetChar,
    setTargetChar,
    readChar,
    setReadChar,
    isFuzzing,
    logs,
    delay,
    setDelay,
    sweepTemplate,
    setSweepTemplate,
    sweepRange,
    setSweepRange,
    sendCommand,
    saveSettings,
    startFuzz,
    startByteSweep,
    stopFuzzer,
    clearLogs,
  } = useDeviceLab(deviceId);

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen">
      <Header mockMode={false} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 text-white/70"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-white">
            Device Laboratory: {device?.name || deviceId}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <LabConfig
              targetChar={targetChar}
              setTargetChar={setTargetChar}
              readChar={readChar}
              setReadChar={setReadChar}
              delay={delay}
              setDelay={setDelay}
              onSaveDefaults={saveSettings}
            />

            <LabCustomCommand
              customHex={customHex}
              setCustomHex={setCustomHex}
              onSend={sendCommand}
            />

            <LabByteSweep
              sweepTemplate={sweepTemplate}
              setSweepTemplate={setSweepTemplate}
              sweepRange={sweepRange}
              setSweepRange={setSweepRange}
              isFuzzing={isFuzzing}
              onStartSweep={startByteSweep}
            />

            <LabPatternsSweep
              isFuzzing={isFuzzing}
              onStartFuzz={startFuzz}
              onStopFuzzer={stopFuzzer}
              onClearLogs={clearLogs}
            />
          </div>

          <LabInteractionLog logs={logs} readChar={readChar} />
        </div>
      </main>
    </div>
  );
}
