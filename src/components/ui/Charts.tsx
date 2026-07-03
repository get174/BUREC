interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, color = '#0A8FEF', height = 200, formatValue }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 px-1">
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="relative w-full flex justify-center mb-2">
                <span className="text-xs font-semibold text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1">
                  {formatValue ? formatValue(d.value) : d.value}
                </span>
              </div>
              <div
                className="w-full max-w-[40px] rounded-t-md transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${h}%`,
                  backgroundColor: color,
                  minHeight: d.value > 0 ? '4px' : '0',
                }}
              />
              <span className="text-xs text-neutral-500 mt-2 text-center truncate w-full" title={d.label}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 180, thickness = 28, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F5F7FA"
            strokeWidth={thickness}
          />
          {total > 0 &&
            data.map((d, i) => {
              const dash = (d.value / total) * circumference;
              const segment = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  className="transition-all duration-500"
                />
              );
              offset += dash;
              return segment;
            })}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-xl font-bold text-neutral-900 font-display">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-neutral-500 mt-0.5">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-neutral-600 truncate">{d.label}</span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function LineChart({ data, color = '#0A8FEF', height = 200, formatValue }: LineChartProps) {
  if (data.length === 0) return <div style={{ height }} />;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const width = 600;
  const padding = 20;
  const chartHeight = height - 40;
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = padding + chartHeight - ((d.value - min) / range) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#lineGradient)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i} className="group">
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
            <title>{`${p.label}: ${formatValue ? formatValue(p.value) : p.value}`}</title>
          </g>
        ))}
        {points.map((p, i) => (
          <text
            key={`label-${i}`}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            className="text-[10px] fill-neutral-500"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
