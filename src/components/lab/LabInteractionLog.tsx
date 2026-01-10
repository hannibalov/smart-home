import React from 'react';

interface InteractionLogEntry {
  id: number;
  name: string;
  hex: string;
  success: boolean;
  readValue: string;
  timestamp: string;
}

interface LabInteractionLogProps {
  logs: InteractionLogEntry[];
  readChar: string;
}

const LabInteractionLog: React.FC<LabInteractionLogProps> = ({ logs, readChar }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col h-[600px]">
      <h2 className="text-xl font-semibold text-white mb-4">Live Interaction Log</h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {logs.length === 0 && (
          <p className="text-white/20 text-center py-20">No interactions recorded yet</p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3 bg-white/5 rounded-lg border border-white/5 text-sm"
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`font-bold ${log.success ? 'text-green-400' : 'text-red-400'}`}>
                {log.name}
              </span>
              <span className="text-xs text-white/30">{log.timestamp}</span>
            </div>
            <div className="font-mono text-xs text-white/70 mb-1">
              <span className="text-white/30 mr-2">HEX:</span> {log.hex}
            </div>
            <div className="font-mono text-xs text-white/70">
              <span className="text-cyan-400/50 mr-2">READ ({readChar}):</span>
              <span className={log.readValue ? 'text-cyan-400' : 'text-white/20'}>
                {log.readValue || 'no response'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default LabInteractionLog;
