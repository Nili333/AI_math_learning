"use client";

import { useApp } from "@/context/AppContext";
import { Menu, Sparkles } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
}

export function TopBar({ title, subtitle, onMenu }: TopBarProps) {
  const { state } = useApp();

  return (
    <header className="h-16 bg-white/95 backdrop-blur border-b border-border flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        {onMenu && (
          <button
            onClick={onMenu}
            className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 flex-shrink-0"
            aria-label="打开导航菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs text-slate-600">AI助手在线</span>
        </div>
        <div className="hidden md:block text-sm text-slate-600">
          {state.user?.nickname} · {state.user?.grade}
        </div>
        <div className="md:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
          {state.user?.nickname?.[0] || "学"}
        </div>
      </div>
    </header>
  );
}
