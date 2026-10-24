import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 text-primary" />
        </div>
        <p className="mt-5 text-5xl font-bold text-slate-800">404</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-700">页面走丢了</h1>
        <p className="mt-2 text-sm text-slate-500">
          你访问的页面不存在，或者链接已经失效。
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          <Home className="w-4 h-4" /> 返回学习首页
        </Link>
      </div>
    </div>
  );
}
