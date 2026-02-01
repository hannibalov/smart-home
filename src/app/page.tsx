"use client";

import { supabaseClient } from '@/lib/supabase-auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DeviceList from '@/components/dashboard/DeviceList';
import ControlPanel from '@/components/dashboard/ControlPanel';
import { useDeviceDashboard } from '@/hooks/useDeviceDashboard';

export default function Home() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const {
    devices,
    profiles,
    selectedDevice,
    commandLog,
    connectDevice,
    disconnectDevice,
    selectDevice,
    sendCommand,
    toggleSaveDevice,
    renameDevice,
    refreshDevices,
  } = useDeviceDashboard();

  const savedDevices = devices.filter(d => d.saved);

  const handleScan = () => {
    setIsScanning(true);
    // Navigate to scan page
    router.push('/scan');
  };

  return (
    <div className="min-h-screen">
      <Header mockMode={false} />
      
      <div className="absolute top-4 right-4">
        <button
          onClick={async () => {
            await supabaseClient.auth.signOut();
            // After signing out, navigate to login page
            router.push('/login');
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Log Out
        </button>
      </div>

      <main className="container mx-auto px-4 py-8">
        <DashboardHeader
          deviceCount={savedDevices.length}
          scanning={isScanning}
          onScan={handleScan}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DeviceList
            title="My Devices"
            devices={savedDevices}
            profiles={profiles}
            onConnect={connectDevice}
            onDisconnect={disconnectDevice}
            onSelect={selectDevice}
            onProfileChange={refreshDevices}
            onToggleSave={toggleSaveDevice}
            onRename={renameDevice}
            emptyMessage="No saved devices. Click 'Add Device' to start."
          />

          <ControlPanel
            selectedDevice={selectedDevice}
            profiles={profiles}
            commandLog={commandLog}
            onCommand={sendCommand}
            onProfileChange={refreshDevices}
          />
        </div>
      </main>
    </div>
  );
}
