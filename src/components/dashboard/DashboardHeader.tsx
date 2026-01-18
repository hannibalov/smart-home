import React from 'react';

interface DashboardHeaderProps {
  deviceCount: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ deviceCount }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Device Dashboard</h1>
        <p className="text-white/50">
          {deviceCount === 0
            ? 'No devices found. Add a new device to get started.'
            : `${deviceCount} device${deviceCount !== 1 ? 's' : ''} saved`}
        </p>
      </div>

      <div className="flex gap-3">
        <a
            href="/scan"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
            />
            </svg>
            Add Device
        </a>
      </div>
    </div>
  );
};

export default DashboardHeader;
