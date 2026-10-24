"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useApp } from "@/context/AppContext";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

function Splash({ text = "正在加载学习数据..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
        <GraduationCap className="w-8 h-8 text-white" />
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        {text}
      </div>
    </div>
  );
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { state, hydrated } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 路由变化时关闭移动端抽屉
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // 未登录时统一跳转登录页（刷新后先等待本地会话恢复）
  useEffect(() => {
    if (hydrated && !state.user) {
      router.replace("/");
    }
  }, [hydrated, state.user, router]);

  // 抽屉打开时锁定页面滚动
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  if (!hydrated || !state.user) {
    return <Splash text={hydrated ? "正在跳转到登录页..." : "正在加载学习数据..."} />;
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <Sidebar />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            <Sidebar variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-60 print:pl-0">
        <TopBar title={title} subtitle={subtitle} onMenu={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 pb-16 lg:pb-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
