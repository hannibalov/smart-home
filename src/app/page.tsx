'use client';

import Header from '@/components/common/Header';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DeviceList from '@/components/dashboard/DeviceList';
import ControlPanel from '@/components/dashboard/ControlPanel';
import { useDeviceDashboard } from '@/hooks/useDeviceDashboard';

export default function Home() {
  const {
    devices,
    profiles,
    scanning,
    selectedDevice,
    commandLog,
    startScan,
    connectDevice,
    disconnectDevice,
    selectDevice,
    sendCommand,
    toggleSaveDevice,
    renameDevice,
    refreshDevices,
  } = useDeviceDashboard();

  const savedDevices = devices.filter(d => d.saved);

  return (
    <div className="min-h-screen">
      <Header mockMode={false} />

      <main className="container mx-auto px-4 py-8">
        <DashboardHeader
          deviceCount={savedDevices.length}
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
