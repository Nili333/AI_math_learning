interface LoadingProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function Loading({ text, size = "md" }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <svg className={`animate-spin ${sizeClasses[size]} text-primary`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}

export function FullPageLoading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading text={text} size="lg" />
    </div>
  );
}
