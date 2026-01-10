'use client';

interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'scanning';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig = {
  connected: {
    color: 'bg-emerald-400',
    shadow: 'shadow-emerald-400/50',
    label: 'Connected',
    animate: false,
  },
  disconnected: {
    color: 'bg-zinc-400',
    shadow: 'shadow-zinc-400/30',
    label: 'Disconnected',
    animate: false,
  },
  connecting: {
    color: 'bg-amber-400',
    shadow: 'shadow-amber-400/50',
    label: 'Connecting...',
    animate: true,
  },
  scanning: {
    color: 'bg-cyan-400',
    shadow: 'shadow-cyan-400/50',
    label: 'Scanning...',
    animate: true,
  },
};

const sizeConfig = {
  sm: { dot: 'w-2 h-2', text: 'text-xs' },
  md: { dot: 'w-3 h-3', text: 'text-sm' },
  lg: { dot: 'w-4 h-4', text: 'text-base' },
};

export default function StatusIndicator({
  status,
  size = 'md',
  showLabel = true,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizes.dot} rounded-full ${config.color} shadow-lg ${config.shadow} ${
          config.animate ? 'animate-pulse' : ''
        }`}
      />
      {showLabel && (
        <span className={`${sizes.text} text-white/70`}>{config.label}</span>
      )}
    </div>
  );
}
