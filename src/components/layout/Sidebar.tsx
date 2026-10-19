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
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";

const navItems = [
  { href: "/dashboard", label: "学习首页", icon: Home },
  { href: "/wrong-questions", label: "错题本", icon: BookOpen },
  { href: "/weak-points", label: "知识画像", icon: BarChart3 },
  { href: "/projects", label: "项目学习", icon: Layers },
];

// 预留入口（置灰，即将开放）
const upcomingItems = [
  { label: "教师端", icon: GraduationCap },
  { label: "管理后台", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { state, logout } = useApp();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast("已退出登录", "info");
    router.push("/");
  };

  return (
    <aside className="w-60 bg-white border-r border-border flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm">AI数学学习系统</span>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase mb-2">学习</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-primary"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        <p className="px-3 text-xs font-semibold text-slate-400 uppercase mt-6 mb-2">更多功能</p>
        {upcomingItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 cursor-not-allowed"
              title="即将开放"
            >
              <Icon className="w-5 h-5" />
              {item.label}
              <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                即将开放
              </span>
            </div>
          );
        })}
      </nav>

      {/* 用户信息 */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {state.user?.nickname?.[0] || "学"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{state.user?.nickname}</p>
            <p className="text-xs text-slate-400 truncate">{state.user?.grade}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
