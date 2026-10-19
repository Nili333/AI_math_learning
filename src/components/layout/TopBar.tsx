"use client";

import { useApp } from "@/context/AppContext";
import { Sparkles } from "lucide-react";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { state } = useApp();

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs text-slate-600">AI助手在线</span>
        </div>
        <div className="text-sm text-slate-600">
          {state.user?.nickname} · {state.user?.grade}
        </div>
      </div>
    </header>
  );
}
