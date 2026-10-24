interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

// 纯SVG横向柱状图，无需外部图表库
export function BarChart({ data, color = "#2563eb" }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3">
          <span className="w-24 sm:w-28 text-xs sm:text-sm text-slate-600 text-right flex-shrink-0 leading-tight">
            {d.label}
          </span>
          <div className="flex-1 h-7 bg-slate-100 rounded-md relative overflow-hidden min-w-0">
            <div
              className="h-full rounded-md flex items-center justify-end px-2 transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            >
              <span className="text-xs text-white font-bold">{d.value}次</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
