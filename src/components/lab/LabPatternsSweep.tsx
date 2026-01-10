import React from 'react';

interface LabPatternsSweepProps {
  isFuzzing: boolean;
  onStartFuzz: () => void;
  onStopFuzzer: () => void;
  onClearLogs: () => void;
}

const LabPatternsSweep: React.FC<LabPatternsSweepProps> = ({
  isFuzzing,
  onStartFuzz,
  onStopFuzzer,
  onClearLogs,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-4">Brute Force / Sweeps</h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onStartFuzz}
          disabled={isFuzzing}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            isFuzzing
              ? 'bg-amber-500/20 text-amber-500 animate-pulse'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/20'
          }`}
        >
          {isFuzzing ? 'Fuzzing...' : 'Common Patterns Sweep'}
        </button>
        <button
          onClick={onStopFuzzer}
          className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
        >
          Stop
        </button>
        <button
          onClick={onClearLogs}
          className="px-6 py-2 bg-white/5 text-white/50 rounded-lg hover:bg-white/10 transition-colors"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
};

export default LabPatternsSweep;
