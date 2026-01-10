import React from 'react';

interface LabByteSweepProps {
  sweepTemplate: string;
  setSweepTemplate: (val: string) => void;
  sweepRange: { start: number; end: number };
  setSweepRange: (val: { start: number; end: number }) => void;
  isFuzzing: boolean;
  onStartSweep: () => void;
}

const presets = [
  { name: 'iLink Power ON', template: '55aa01080501f1' },
  { name: 'iLink Power OFF', template: '55aa01080500f2' },
  { name: 'iLink Fan Speed 1', template: '55aa01050101f8' },
  { name: 'iLink Fan Speed 3', template: '55aa01050103f6' },
  { name: 'iLink Fan OFF', template: '55aa01050100f9' },
  { name: 'iLink RED', template: '55aa030802ff0000f4' },
  { name: 'iLink GREEN', template: '55aa03080200ff00f4' },
  { name: 'iLink BLUE', template: '55aa0308020000fff4' },
  { name: 'iLink White (High)', template: '55aa010808f8f7' },
  { name: 'Magic HL Header', template: '??0404f00001ff00ef' },
];

const LabByteSweep: React.FC<LabByteSweepProps> = ({
  sweepTemplate,
  setSweepTemplate,
  sweepRange,
  setSweepRange,
  isFuzzing,
  onStartSweep,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-4">Byte Sweep (Brute Force)</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-white/50 mb-1">
            Command Template (use ?? for wildcard)
          </label>
          <input
            value={sweepTemplate}
            onChange={(e) => setSweepTemplate(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white font-mono"
            placeholder="7e04??f00001ff00ef"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Common Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => setSweepTemplate(p.template)}
                className="text-[10px] text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors"
              >
                <div className="font-bold text-white/80">{p.name}</div>
                <div className="text-white/30 truncate">{p.template}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-white/50 mb-1">Start (Dec)</label>
            <input
              type="number"
              value={sweepRange.start}
              onChange={(e) =>
                setSweepRange({ ...sweepRange, start: Number(e.target.value) })
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-white/50 mb-1">End (Dec)</label>
            <input
              type="number"
              value={sweepRange.end}
              onChange={(e) =>
                setSweepRange({ ...sweepRange, end: Number(e.target.value) })
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onStartSweep}
            disabled={isFuzzing}
            className={`flex-1 py-2 rounded-lg font-medium transition-all duration-200 ${
              isFuzzing
                ? 'bg-indigo-500/20 text-indigo-500 animate-pulse'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 shadow-sm'
            }`}
          >
            Run Byte Sweep
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabByteSweep;
