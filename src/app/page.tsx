"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { loginApi } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useApp();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast("请输入账号和密码", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ username, password });
      login(res.user, res.token);
      showToast("登录成功，欢迎回来！", "success");
      router.push("/dashboard");
    } catch {
      showToast("账号或密码错误", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-blue-200">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            AI数学错因诊断与项目式学习系统
          </h1>
          <p className="text-sm text-slate-500 mt-2">智能诊断 · 精准提升 · 项目驱动</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full">
              登 录
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              演示账号：<span className="font-mono text-slate-600">student01</span>
              {" / "}
              <span className="font-mono text-slate-600">123456</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2024 AI数学错因诊断与项目式学习系统
        </p>
      </div>
    </div>
  );
}
