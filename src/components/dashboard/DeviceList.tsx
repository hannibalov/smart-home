import React from 'react';
import DeviceCard from './DeviceCard';
import type { DeviceDetails, DeviceProfile } from '@/types';

interface DeviceListProps {
  devices: DeviceDetails[];
  profiles: DeviceProfile[];
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onSelect: (id: string) => void;
  onProfileChange: () => void;
  onToggleSave: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  profiles,
  onConnect,
  onDisconnect,
  onSelect,
  onProfileChange,
  onToggleSave,
  onRename,
}) => {
  return (
    <div className="lg:col-span-2">
      <h2 className="text-lg font-semibold text-white/70 mb-4">Available Devices</h2>
      
      {devices.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white/70 mb-2">No Devices Found</h3>
          <p className="text-white/40 max-w-sm mx-auto">
            Click the &quot;Scan for Devices&quot; button to discover nearby Bluetooth devices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...devices]
            .sort((a, b) => {
              if (a.saved && !b.saved) return -1;
              if (!a.saved && b.saved) return 1;
              return 0;
            })
            .map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                profiles={profiles}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                onSelect={onSelect}
                onProfileChange={onProfileChange}
                onToggleSave={onToggleSave}
                onRename={onRename}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default DeviceList;
