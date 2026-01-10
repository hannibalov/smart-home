import React from 'react';

interface LabCustomCommandProps {
  customHex: string;
  setCustomHex: (val: string) => void;
  onSend: (hex: string) => void;
}

const LabCustomCommand: React.FC<LabCustomCommandProps> = ({
  customHex,
  setCustomHex,
  onSend,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-4">Custom Command</h2>
      <div className="flex gap-2">
        <input
          placeholder="e.g. 7e0404f00001ff00ef"
          value={customHex}
          onChange={(e) => setCustomHex(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
        />
        <button
          onClick={() => onSend(customHex)}
          className="px-6 py-2 bg-cyan-500 rounded-lg text-white font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default LabCustomCommand;
