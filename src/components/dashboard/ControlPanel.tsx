import React from 'react';
import LightControl from './LightControl';
import type { DeviceDetails, DeviceProfile, CommandLogEntry } from '@/types';

interface ControlPanelProps {
  selectedDevice: DeviceDetails | null;
  profiles: DeviceProfile[];
  commandLog: CommandLogEntry[];
  onCommand: (type: string, value: unknown) => Promise<boolean>;
  onProfileChange: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedDevice,
  profiles,
  commandLog,
  onCommand,
  onProfileChange,
}) => {
  return (
    <div className="lg:col-span-1">
      <h2 className="text-lg font-semibold text-white/70 mb-4">Control Panel</h2>
      
      {selectedDevice ? (
        <LightControl
          device={selectedDevice}
          profiles={profiles}
          onCommand={onCommand}
          commandLog={commandLog}
          onProfileChange={onProfileChange}
        />
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center border border-white/10">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-white/50 mb-1">No Device Selected</h3>
          <p className="text-xs text-white/30">
            Connect to a device to access controls
          </p>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
