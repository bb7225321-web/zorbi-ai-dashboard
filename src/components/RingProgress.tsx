export function RingProgress({
  value,
  size = 168,
  stroke = 13,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="zorbi-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5B7CFF" />
            <stop offset="55%" stopColor="#8B7CFF" />
            <stop offset="100%" stopColor="#6FD0A8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#zorbi-ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="drop-shadow-[0_0_10px_rgba(100,120,255,0.45)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tracking-tight text-slate-900">
          {value}%
        </span>
        {label && (
          <span className="mt-1 max-w-[110px] text-center text-xs font-semibold text-slate-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
