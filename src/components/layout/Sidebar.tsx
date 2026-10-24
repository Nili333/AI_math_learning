"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  BarChart3,
  Layers,
  GraduationCap,
  Settings,
  LogOut,
  Upload,
  ClipboardList,
  X,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";

const primaryNav = [
  { href: "/dashboard", label: "学习首页", icon: Home },
  { href: "/wrong-questions", label: "错题本", icon: BookOpen },
  { href: "/weak-points", label: "知识画像", icon: BarChart3 },
  { href: "/projects", label: "项目学习", icon: Layers },
  { href: "/report", label: "学习报告", icon: ClipboardList },
];

const toolNav = [
  { href: "/upload", label: "上传错题", icon: Upload },
  { href: "/settings", label: "设置与数据", icon: Settings },
];

interface SidebarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export function Sidebar({ variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { state, logout } = useApp();
  const router = useRouter();
  const { showToast } = useToast();

  const isActive = (href: string) => {
    if (href === "/wrong-questions") {
      return pathname.startsWith("/wrong-questions") || pathname === "/analysis";
    }
    if (href === "/projects") {
      return (
        pathname.startsWith("/projects") ||
        pathname.startsWith("/project/") ||
        pathname === "/textbook"
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout();
    showToast("已退出登录", "info");
    router.push("/");
  };

  const linkClass = (active: boolean) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      active
        ? "bg-blue-50 text-primary"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  const content = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border flex-shrink-0">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-slate-800 text-sm block">AI数学学习</span>
            <span className="text-[10px] text-slate-400">错因诊断 · 项目式学习</span>
          </div>
        </Link>
        {variant === "mobile" && (
          <button
            onClick={onNavigate}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="关闭导航"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          学习空间
        </p>
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={linkClass(isActive(item.href))}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive(item.href) && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">
          工具
        </p>
        {toolNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={linkClass(isActive(item.href))}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-6 mx-1 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            AI 学习建议
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">
            先订正错题，再完成一个针对性项目，知识掌握会更牢固。
          </p>
        </div>
      </nav>

      {/* 用户信息 */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <Link
            href="/settings"
            onClick={onNavigate}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            aria-label="个人设置"
          >
            {state.user?.nickname?.[0] || "学"}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href="/settings"
              onClick={onNavigate}
              className="text-sm font-medium text-slate-800 truncate block hover:text-primary"
            >
              {state.user?.nickname || "同学"}
            </Link>
            <p className="text-xs text-slate-400 truncate">{state.user?.grade || "高中生"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
            title="退出登录"
            aria-label="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <aside
      className={
        variant === "desktop"
          ? "hidden lg:flex fixed inset-y-0 left-0 w-60 bg-white border-r border-border flex-col z-40 print:hidden"
          : "flex h-full w-[280px] max-w-[85vw] bg-white flex-col"
      }
    >
      {content}
    </aside>
  );
}
