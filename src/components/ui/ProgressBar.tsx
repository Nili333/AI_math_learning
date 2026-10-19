interface ProgressBarProps {
  value: number; // 0-100
  color?: "primary" | "success" | "warning" | "danger";
  label?: string;
  showValue?: boolean;
  height?: string;
}

const colorClasses: Record<string, string> = {
  primary: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export function ProgressBar({
  value,
  color = "primary",
  label,
  showValue = false,
  height = "h-2",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-slate-600">{label}</span>}
          {showValue && <span className="text-sm font-medium text-slate-700">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
