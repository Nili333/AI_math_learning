interface RadarChartProps {
  data: { label: string; value: number }[]; // value: 0-100
  size?: number;
}

// 纯SVG雷达图，无需外部图表库
export function RadarChart({ data, size = 300 }: RadarChartProps) {
  const center = size / 2;
  const radius = size / 2 - 50;
  const levels = 4;
  const angleStep = (2 * Math.PI) / data.length;

  const pointAt = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: center + radius * ratio * Math.cos(angle),
      y: center + radius * ratio * Math.sin(angle),
    };
  };

  const dataPoints = data.map((d, i) => pointAt(i, d.value / 100));
  const polygonPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 网格背景 */}
      {Array.from({ length: levels }, (_, l) => {
        const ratio = (l + 1) / levels;
        const points = data
          .map((_, i) => pointAt(i, ratio))
          .map((p) => `${p.x},${p.y}`)
          .join(" ");
        return <polygon key={l} points={points} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {/* 轴线 */}
      {data.map((_, i) => {
        const p = pointAt(i, 1);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {/* 数据区域 */}
      <polygon points={polygonPath} fill="rgba(37, 99, 235, 0.15)" stroke="#2563eb" strokeWidth="2" />
      {/* 数据点 */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2563eb" />
      ))}
      {/* 标签 */}
      {data.map((d, i) => {
        const p = pointAt(i, 1.25);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium"
            fill="#475569"
          >
            {d.label}
            <tspan x={p.x} dy="16" fill="#2563eb" fontWeight="bold">
              {d.value}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
