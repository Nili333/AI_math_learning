"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-slate-800">页面遇到了一点问题</h1>
        <p className="mt-2 text-sm text-slate-500">
          {error.message || "请稍后重试，或返回首页继续学习。"}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <RotateCcw className="w-4 h-4" /> 重试
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
          >
            <Home className="w-4 h-4" /> 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
