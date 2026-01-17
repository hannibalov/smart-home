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
  title?: string;
  emptyMessage?: string;
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
  title = "Available Devices",
  emptyMessage = "No devices found."
}) => {
  return (
    <div className="lg:col-span-2">
      <h2 className="text-lg font-semibold text-white/70 mb-4">{title}</h2>
      
      {devices.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center border border-white/10 mb-8">
          <p className="text-white/40 max-w-sm mx-auto">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {devices.map((device) => (
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
