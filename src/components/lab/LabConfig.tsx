import React from 'react';

interface LabConfigProps {
  targetChar: string;
  setTargetChar: (val: string) => void;
  readChar: string;
  setReadChar: (val: string) => void;
  delay: number;
  setDelay: (val: number) => void;
  onSaveDefaults: () => void;
}

const LabConfig: React.FC<LabConfigProps> = ({
  targetChar,
  setTargetChar,
  readChar,
  setReadChar,
  delay,
  setDelay,
  onSaveDefaults,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Configuration</h2>
        <button
          onClick={onSaveDefaults}
          className="text-xs px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
        >
          Save as Default
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1">Target Char (Write)</label>
          <input
            value={targetChar}
            onChange={(e) => setTargetChar(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setTargetChar('a044')}
              className="text-[10px] bg-white/5 px-2 py-1 rounded"
            >
              a044
            </button>
            <button
              onClick={() => setTargetChar('a040')}
              className="text-[10px] bg-white/5 px-2 py-1 rounded"
            >
              a040
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Feedback Char (Read)</label>
          <input
            value={readChar}
            onChange={(e) => setReadChar(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setReadChar('a041')}
              className="text-[10px] bg-white/5 px-2 py-1 rounded"
            >
              a041
            </button>
            <button
              onClick={() => setReadChar('a042')}
              className="text-[10px] bg-white/5 px-2 py-1 rounded"
            >
              a042
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-xs text-white/50 mb-1">Delay between commands (ms)</label>
        <input
          type="number"
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
        />
      </div>
    </div>
  );
};

export default LabConfig;
