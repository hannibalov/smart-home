import React from 'react';

interface DashboardHeaderProps {
  deviceCount: number;
  scanning: boolean;
  onScan: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ deviceCount, scanning, onScan }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Device Dashboard</h1>
        <p className="text-white/50">
          {deviceCount === 0
            ? 'No devices found. Start a scan to discover nearby BLE devices.'
            : `${deviceCount} device${deviceCount !== 1 ? 's' : ''} found`}
        </p>
      </div>

      <button
        onClick={onScan}
        disabled={scanning}
        className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
          scanning
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 cursor-wait'
            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
        }`}
      >
        {scanning ? (
          <span className="flex items-center gap-3">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 radar-sweep" />
            </div>
            Scanning...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Scan for Devices
          </span>
        )}
      </button>
    </div>
  );
};

export default DashboardHeader;
